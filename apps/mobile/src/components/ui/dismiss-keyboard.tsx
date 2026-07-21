import type { ReactNode } from "react"
import { Pressable, Keyboard } from "react-native"

export function DismissKeyboard({ children }: { children: ReactNode }) {
  return (
    <Pressable className="flex-1" onPress={Keyboard.dismiss} accessible={false}>
      {children}
    </Pressable>
  )
}
