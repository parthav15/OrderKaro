import type { ReactNode } from "react"
import { View, KeyboardAvoidingView, Platform } from "react-native"
import { SafeAreaView, type Edge } from "react-native-safe-area-context"

export function Screen({
  children,
  edges = ["top", "bottom"],
  padded = true,
}: {
  children: ReactNode
  edges?: Edge[]
  padded?: boolean
}) {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-canvas">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className={padded ? "flex-1 px-5" : "flex-1"}>{children}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
