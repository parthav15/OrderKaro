import { View, Text, StyleSheet } from "react-native"
import Animated, { FadeIn } from "react-native-reanimated"
import { colors, typography, spacing, radii, shadows } from "@/constants/theme"
import { formatPrice } from "@/lib/utils"

interface BalanceCardProps {
  balance: number
}

export default function BalanceCard({ balance }: BalanceCardProps) {
  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.card}>
      <Text style={styles.label}>Available Balance</Text>
      <Text style={styles.balance}>{formatPrice(balance)}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.black,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    ...shadows.lg,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.neutral[400],
  },
  balance: {
    fontSize: typography.sizes["4xl"],
    fontWeight: typography.weights.extrabold,
    color: colors.white,
  },
})
