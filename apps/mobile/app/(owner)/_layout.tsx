import { Stack } from "expo-router"
import { useTheme } from "@/theme/theme-provider"

export default function OwnerLayout() {
  const { colors } = useTheme()
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        contentStyle: { backgroundColor: colors.canvas },
      }}
    />
  )
}
