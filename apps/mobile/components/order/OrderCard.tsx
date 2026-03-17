import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import Animated, { FadeIn } from "react-native-reanimated"
import { colors, typography, spacing, radii, shadows } from "@/constants/theme"
import { formatPrice, formatTime, getTimeSince } from "@/lib/utils"
import StatusBadge from "./StatusBadge"

interface OrderCardProps {
  order: {
    id: string
    orderNumber: number
    status: string
    totalAmount: number
    placedAt: string
    trackingToken: string
    items: Array<{ name: string; quantity: number }>
  }
  onPress: () => void
}

export default function OrderCard({ order, onPress }: OrderCardProps) {
  const itemsSummary = order.items
    .map((i) => `${i.quantity}x ${i.name}`)
    .join(", ")

  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
            <Text style={styles.time}>{getTimeSince(order.placedAt)}</Text>
          </View>
          <StatusBadge status={order.status} />
        </View>

        <Text style={styles.items} numberOfLines={2}>{itemsSummary}</Text>

        <View style={styles.bottomRow}>
          <Text style={styles.total}>{formatPrice(order.totalAmount)}</Text>
          <Text style={styles.viewDetails}>View Details</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    gap: spacing.md,
    ...shadows.sm,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  orderNumber: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  time: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[400],
  },
  items: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[500],
    lineHeight: 18,
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
  viewDetails: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.red,
  },
})
