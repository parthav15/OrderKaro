import { useState, useEffect } from "react"
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { SafeAreaView } from "react-native-safe-area-context"
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated"
import { Ionicons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import { colors, typography, spacing, radii, shadows } from "@/constants/theme"
import { formatPrice, getTimeSince } from "@/lib/utils"
import { useOrderTracking } from "@/hooks/useOrderTracking"
import { useAuthStore } from "@/stores/auth"
import api from "@/lib/api"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import StatusTimeline from "@/components/order/StatusTimeline"
import StatusBadge from "@/components/order/StatusBadge"
import Skeleton from "@/components/ui/Skeleton"

export default function TrackingScreen() {
  const { token } = useLocalSearchParams<{ token: string }>()
  const router = useRouter()
  const canteen = useAuthStore((s) => s.canteen)
  const [cancelling, setCancelling] = useState(false)

  const { data: trackData, isLoading: trackLoading } = useQuery({
    queryKey: ["track", token],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/public/track/${token}`)
      return data.data
    },
    enabled: !!token,
  })

  const orderId = trackData?.id
  const canteenId = trackData?.canteenId || canteen?.canteenId

  const { order, loading: socketLoading } = useOrderTracking(
    orderId || null,
    canteenId || null
  )

  const displayOrder = order || trackData
  const isLoading = trackLoading && !displayOrder

  useEffect(() => {
    if (displayOrder?.status === "READY") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  }, [displayOrder?.status])

  const handleCancel = async () => {
    if (!orderId || !canteenId) return

    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          setCancelling(true)
          try {
            await api.post(
              `/api/v1/canteens/${canteenId}/orders/${orderId}/cancel`
            )
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
          } catch (err: any) {
            Alert.alert(
              "Cannot Cancel",
              err.response?.data?.message || "Failed to cancel order"
            )
          } finally {
            setCancelling(false)
          }
        },
      },
    ])
  }

  const canCancel =
    displayOrder?.status === "PLACED" ||
    (displayOrder?.status === "ACCEPTED" &&
      new Date().getTime() - new Date(displayOrder.acceptedAt).getTime() < 60000)

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Skeleton width="60%" height={24} />
          <Skeleton width="40%" height={16} />
          <Skeleton width="100%" height={200} />
        </View>
      </SafeAreaView>
    )
  }

  if (!displayOrder) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.neutral[300]} />
          <Text style={styles.errorTitle}>Order not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="outline" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <Button
          title="Back"
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
          icon={<Ionicons name="arrow-back" size={20} color={colors.black} />}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {displayOrder.status === "READY" && (
          <Animated.View entering={FadeIn.duration(500)} style={styles.readyBanner}>
            <Ionicons name="checkmark-circle" size={28} color={colors.white} />
            <Text style={styles.readyText}>Your order is ready!</Text>
            <Text style={styles.readySubtext}>Please pick it up at the counter</Text>
          </Animated.View>
        )}

        {displayOrder.status === "CANCELLED" && (
          <Animated.View entering={FadeIn.duration(500)} style={styles.cancelledBanner}>
            <Ionicons name="close-circle" size={28} color={colors.white} />
            <Text style={styles.readyText}>Order Cancelled</Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.duration(400)}>
          <Card>
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderNumber}>
                  Order #{displayOrder.orderNumber}
                </Text>
                <Text style={styles.orderTime}>
                  {getTimeSince(displayOrder.placedAt)}
                </Text>
              </View>
              <StatusBadge status={displayOrder.status} />
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <Card style={styles.timelineCard}>
            <Text style={styles.sectionTitle}>Order Status</Text>
            <StatusTimeline
              status={displayOrder.status}
              placedAt={displayOrder.placedAt}
              acceptedAt={displayOrder.acceptedAt}
              preparingAt={displayOrder.preparingAt}
              readyAt={displayOrder.readyAt}
              pickedUpAt={displayOrder.pickedUpAt}
              cancelledAt={displayOrder.cancelledAt}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <Card>
            <Text style={styles.sectionTitle}>Items</Text>
            <View style={styles.itemsList}>
              {displayOrder.items?.map((item: any, idx: number) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>
                    {formatPrice(item.totalPrice || item.unitPrice * item.quantity)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {formatPrice(displayOrder.totalAmount)}
              </Text>
            </View>
          </Card>
        </Animated.View>

        {canCancel && (
          <Animated.View entering={FadeInDown.duration(400).delay(300)}>
            <Button
              title="Cancel Order"
              onPress={handleCancel}
              loading={cancelling}
              variant="outline"
              fullWidth
              style={styles.cancelButton}
            />
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  headerBar: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing["4xl"],
  },
  readyBanner: {
    backgroundColor: colors.success,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    ...shadows.md,
  },
  cancelledBanner: {
    backgroundColor: colors.neutral[600],
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    ...shadows.md,
  },
  readyText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  readySubtext: {
    fontSize: typography.sizes.sm,
    color: "rgba(255,255,255,0.8)",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderNumber: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extrabold,
    color: colors.black,
  },
  orderTime: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[500],
    marginTop: 2,
  },
  timelineCard: {
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.black,
    marginBottom: spacing.md,
  },
  itemsList: {
    gap: spacing.sm,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  itemQuantity: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.red,
    width: 28,
  },
  itemName: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.black,
  },
  itemPrice: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.black,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  totalLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.black,
  },
  totalValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extrabold,
    color: colors.black,
  },
  cancelButton: {
    borderColor: colors.red,
  },
  loadingContainer: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  errorTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
})
