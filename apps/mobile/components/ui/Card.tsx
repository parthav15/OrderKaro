import { View, StyleSheet, ViewStyle } from "react-native"
import { colors, radii, spacing, shadows } from "@/constants/theme"

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
  noPadding?: boolean
}

export default function Card({ children, style, noPadding }: CardProps) {
  return (
    <View style={[styles.card, !noPadding && styles.padding, style]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...shadows.sm,
  },
  padding: {
    padding: spacing.lg,
  },
})
