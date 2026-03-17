import { View, Text, StyleSheet, ViewStyle } from "react-native"
import { colors, typography, radii, spacing } from "@/constants/theme"

type BadgeVariant = "red" | "black" | "outline" | "success" | "warning"

interface BadgeProps {
  text: string
  variant?: BadgeVariant
  style?: ViewStyle
}

const variantMap: Record<BadgeVariant, { bg: string; text: string; border?: string }> = {
  red: { bg: colors.red, text: colors.white },
  black: { bg: colors.black, text: colors.white },
  outline: { bg: "transparent", text: colors.neutral[600], border: colors.neutral[300] },
  success: { bg: "#DCFCE7", text: colors.success },
  warning: { bg: "#FEF3C7", text: "#92400E" },
}

export default function Badge({ text, variant = "red", style }: BadgeProps) {
  const v = variantMap[variant]

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: v.bg,
          borderColor: v.border || "transparent",
          borderWidth: v.border ? 1 : 0,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: v.text }]}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
})
