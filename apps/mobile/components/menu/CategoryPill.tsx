import { TouchableOpacity, Text, StyleSheet } from "react-native"
import * as Haptics from "expo-haptics"
import { colors, typography, spacing, radii } from "@/constants/theme"

interface CategoryPillProps {
  name: string
  isActive: boolean
  onPress: () => void
}

export default function CategoryPill({ name, isActive, onPress }: CategoryPillProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={[
        styles.pill,
        { backgroundColor: isActive ? colors.red : colors.neutral[100] },
      ]}
    >
      <Text style={[styles.text, isActive && styles.activeText]}>{name}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
    marginRight: spacing.sm,
  },
  text: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.neutral[600],
  },
  activeText: {
    color: colors.white,
  },
})
