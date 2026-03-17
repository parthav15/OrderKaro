import { useState } from "react"
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
} from "react-native"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { colors, typography, radii, spacing } from "@/constants/theme"

interface InputProps extends TextInputProps {
  label?: string
  error?: string
}

export default function Input({ label, error, style, ...props }: InputProps) {
  const borderColor = useSharedValue(colors.neutral[200])
  const [focused, setFocused] = useState(false)

  const animatedBorder = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
  }))

  const handleFocus = () => {
    setFocused(true)
    borderColor.value = withTiming(colors.red)
  }

  const handleBlur = () => {
    setFocused(false)
    borderColor.value = withTiming(error ? colors.red : colors.neutral[200])
  }

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View style={[styles.inputWrapper, animatedBorder, error && styles.errorBorder]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.neutral[400]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </Animated.View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.neutral[600],
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: radii.lg,
    borderColor: colors.neutral[200],
  },
  errorBorder: {
    borderColor: colors.red,
  },
  input: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.black,
  },
  error: {
    fontSize: typography.sizes.xs,
    color: colors.red,
  },
})
