import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated"
import * as Haptics from "expo-haptics"
import { colors, typography, spacing, radii } from "@/constants/theme"
import { formatPrice } from "@/lib/utils"
import VegBadge from "@/components/ui/VegBadge"
import QuantityStepper from "@/components/menu/QuantityStepper"
import { CartItem } from "@/stores/cart"

interface CartItemCardProps {
  item: CartItem
  index: number
  onUpdateQuantity: (index: number, quantity: number) => void
  onRemove: (index: number) => void
}

export default function CartItemCard({
  item,
  index,
  onUpdateQuantity,
  onRemove,
}: CartItemCardProps) {
  const optionsText = item.selectedOptions
    .map((o) => o.optionNames.join(", "))
    .filter(Boolean)
    .join(" \u00B7 ")

  const optionsPrice = item.selectedOptions.reduce(
    (s, o) => s + o.priceAdjustment,
    0
  )
  const itemTotal = (item.price + optionsPrice) * item.quantity

  const handleRemove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onRemove(index)
  }

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      layout={Layout.springify()}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View style={styles.nameSection}>
          <VegBadge isVeg={item.isVeg} />
          <View style={styles.nameCol}>
            <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
            {optionsText ? (
              <Text style={styles.options} numberOfLines={1}>{optionsText}</Text>
            ) : null}
          </View>
        </View>

        <TouchableOpacity onPress={handleRemove} hitSlop={8}>
          <Ionicons name="trash-outline" size={18} color={colors.neutral[400]} />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomRow}>
        <QuantityStepper
          quantity={item.quantity}
          onIncrement={() => onUpdateQuantity(index, item.quantity + 1)}
          onDecrement={() =>
            item.quantity > 1
              ? onUpdateQuantity(index, item.quantity - 1)
              : onRemove(index)
          }
        />
        <Text style={styles.total}>{formatPrice(itemTotal)}</Text>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    gap: spacing.md,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  nameSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    flex: 1,
    paddingRight: spacing.md,
  },
  nameCol: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.black,
  },
  options: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  total: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
})
