import { Pressable, type ViewStyle } from "react-native"
import { MotiView } from "moti"
import * as Haptics from "expo-haptics"
import { Sun, Moon } from "lucide-react-native"
import { useTheme } from "@/theme/theme-provider"

export function ThemeToggle({ style }: { style?: ViewStyle }) {
  const { scheme, colors, toggle, setMode } = useTheme()
  const dark = scheme === "dark"

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync()
        toggle()
      }}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        setMode("system")
      }}
      hitSlop={10}
      style={style}
      className="w-11 h-11 rounded-full items-center justify-center bg-surface border border-line"
    >
      <MotiView
        key={scheme}
        from={{ opacity: 0, rotate: "-70deg", scale: 0.7 }}
        animate={{ opacity: 1, rotate: "0deg", scale: 1 }}
        transition={{ type: "timing", duration: 280 }}
      >
        {dark ? <Moon size={19} color={colors.accent} /> : <Sun size={19} color={colors.accent} />}
      </MotiView>
    </Pressable>
  )
}
