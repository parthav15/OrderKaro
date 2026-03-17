import { useState } from "react"
import {
  View,
  Text,
  FlatList,
  TextInput,
  Alert,
  StyleSheet,
} from "react-native"
import { useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { SafeAreaView } from "react-native-safe-area-context"
import Animated, { FadeInDown } from "react-native-reanimated"
import { Ionicons } from "@expo/vector-icons"
import { colors, typography, spacing, radii } from "@/constants/theme"
import { useCartStore } from "@/stores/cart"
import { useAuthStore } from "@/stores/auth"
import { formatPrice, generateUUID } from "@/lib/utils"
import api from "@/lib/api"
import Button from "@/components/ui/Button"
import CartItemCard from "@/components/cart/CartItemCard"
import PaymentMethodSelector from "@/components/cart/PaymentMethodSelector"

export default function CartScreen() {
  const router = useRouter()
  const {
    items,
    canteenId,
    tableId,
    specialInstructions,
    setSpecialInstructions,
    updateQuantity,
    removeItem,
    getTotal,
    getItemCount,
    clearCart,
  } = useCartStore()
  const canteen = useAuthStore((s) => s.canteen)
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "WALLET">("CASH")
  const [loading, setLoading] = useState(false)

  const { data: walletData } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/wallet/consumer/wallet")
      return data.data
    },
  })

  const total = getTotal()
  const itemCount = getItemCount()

  const handlePlaceOrder = async () => {
    if (items.length === 0 || !canteenId || !tableId) return

    if (paymentMethod === "WALLET" && walletData?.balance < total) {
      Alert.alert("Insufficient Balance", "Please add funds to your wallet or pay with cash.")
      return
    }

    setLoading(true)
    try {
      const orderItems = items.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        selectedOptions: item.selectedOptions.map((o) => ({
          customizationId: o.customizationId,
          optionIds: o.optionIds,
        })),
        notes: item.notes,
      }))

      const { data } = await api.post(`/api/v1/canteens/${canteenId}/orders`, {
        tableId,
        items: orderItems,
        specialInstructions: specialInstructions || undefined,
        paymentMethod,
        idempotencyKey: generateUUID(),
      })

      clearCart()
      const trackingToken = data.data.trackingToken
      router.push(`/track/${trackingToken}`)
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Failed to place order. Please try again."
      Alert.alert("Order Error", message)
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="bag-outline" size={64} color={colors.neutral[300]} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add items from the menu to get started
          </Text>
          <Button
            title="Browse Menu"
            onPress={() => router.push("/(tabs)/menu")}
            variant="outline"
          />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text style={styles.title}>Your Cart</Text>
        <Text style={styles.subtitle}>
          {itemCount} {itemCount === 1 ? "item" : "items"} \u00B7 Table{" "}
          {canteen?.tableLabel}
        </Text>
      </Animated.View>

      <FlatList
        data={items}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <CartItemCard
            item={item}
            index={index}
            onUpdateQuantity={updateQuantity}
            onRemove={removeItem}
          />
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <View style={styles.instructionsSection}>
              <Text style={styles.sectionLabel}>Special Instructions</Text>
              <TextInput
                style={styles.instructionsInput}
                placeholder="Any special requests? (optional)"
                placeholderTextColor={colors.neutral[400]}
                value={specialInstructions}
                onChangeText={setSpecialInstructions}
                multiline
                maxLength={500}
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <PaymentMethodSelector
              selected={paymentMethod}
              onSelect={setPaymentMethod}
              walletBalance={walletData?.balance}
            />

            <View style={styles.totalSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatPrice(total)}</Text>
              </View>
            </View>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.checkoutBar}>
        <Button
          title={`Place Order \u00B7 ${formatPrice(total)}`}
          onPress={handlePlaceOrder}
          loading={loading}
          fullWidth
          size="lg"
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extrabold,
    color: colors.black,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[500],
    fontWeight: typography.weights.medium,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing["3xl"],
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  emptySubtitle: {
    fontSize: typography.sizes.base,
    color: colors.neutral[500],
    marginBottom: spacing.lg,
  },
  footer: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  instructionsSection: {
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.black,
  },
  instructionsInput: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radii.lg,
    padding: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.black,
    minHeight: 80,
  },
  totalSection: {
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.black,
  },
  totalValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extrabold,
    color: colors.black,
  },
  checkoutBar: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    backgroundColor: colors.white,
  },
})
