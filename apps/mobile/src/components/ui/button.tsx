import { Pressable, ActivityIndicator, type PressableProps } from "react-native"
import { MotiView } from "moti"
import * as Haptics from "expo-haptics"
import { useState } from "react"
import { Text } from "./text"
import { useTheme } from "@/theme/theme-provider"

type Variant = "primary" | "outline" | "ghost"

const surface: Record<Variant, string> = {
  primary: "bg-primary",
  outline: "bg-transparent border border-line",
  ghost: "bg-transparent",
}

export function Button({
  title,
  variant = "primary",
  loading = false,
  disabled = false,
  onPress,
  ...props
}: PressableProps & {
  title: string
  variant?: Variant
  loading?: boolean
}) {
  const [pressed, setPressed] = useState(false)
  const { colors } = useTheme()
  const isDisabled = disabled || loading
  const labelColor = variant === "primary" ? colors.onPrimary : colors.ink

  return (
    <Pressable
      disabled={isDisabled}
      onPressIn={() => {
        setPressed(true)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      {...props}
    >
      <MotiView
        animate={{ scale: pressed ? 0.97 : 1, opacity: isDisabled ? 0.55 : 1 }}
        transition={{ type: "timing", duration: 140 }}
        className={`h-14 rounded-2xl items-center justify-center px-6 ${surface[variant]}`}
      >
        {loading ? (
          <ActivityIndicator color={labelColor} />
        ) : (
          <Text variant="label" className="text-base" style={{ color: labelColor }}>
            {title}
          </Text>
        )}
      </MotiView>
    </Pressable>
  )
}
