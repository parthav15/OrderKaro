import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import { colors, typography, spacing, radii } from "@/constants/theme"

interface QuantityStepperProps {
  quantity: number
  onIncrement: () => void
  onDecrement: () => void
  min?: number
  max?: number
}

export default function QuantityStepper({
  quantity,
  onIncrement,
  onDecrement,
  min = 1,
  max = 50,
}: QuantityStepperProps) {
  const handleIncrement = () => {
    if (quantity < max) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      onIncrement()
    }
  }

  const handleDecrement = () => {
    if (quantity > min) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      onDecrement()
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleDecrement}
        style={[styles.button, quantity <= min && styles.disabled]}
        disabled={quantity <= min}
        activeOpacity={0.7}
      >
        <Ionicons name="remove" size={18} color={quantity <= min ? colors.neutral[300] : colors.red} />
      </TouchableOpacity>

      <Text style={styles.quantity}>{quantity}</Text>

      <TouchableOpacity
        onPress={handleIncrement}
        style={[styles.button, quantity >= max && styles.disabled]}
        disabled={quantity >= max}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={18} color={quantity >= max ? colors.neutral[300] : colors.red} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.neutral[50],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  button: {
    padding: spacing.sm,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  quantity: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.black,
    minWidth: 28,
    textAlign: "center",
  },
})
