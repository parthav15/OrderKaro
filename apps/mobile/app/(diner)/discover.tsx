import { useEffect, useState } from "react"
import { View } from "react-native"
import { Sparkles } from "lucide-react-native"
import { Screen } from "@/components/ui/screen"
import { Text } from "@/components/ui/text"
import { Card } from "@/components/ui/card"
import { getIdentity, type Identity } from "@/lib/auth"
import { useTheme } from "@/theme/theme-provider"

export default function Discover() {
  const { colors } = useTheme()
  const [identity, setIdentity] = useState<Identity | null>(null)

  useEffect(() => {
    getIdentity().then(setIdentity)
  }, [])

  return (
    <Screen>
      <View className="flex-1 justify-center">
        <Card>
          <View className="w-12 h-12 rounded-2xl bg-accent/15 items-center justify-center mb-4">
            <Sparkles size={22} color={colors.accent} />
          </View>
          <Text variant="heading" className="text-2xl mb-1">
            You're signed in{identity ? `, ${identity.name.split(" ")[0]}` : ""}.
          </Text>
          <Text variant="muted" className="text-base leading-relaxed">
            The full Vision Menu experience — animated menus, AR dishes, cart and in-app
            payment — arrives next. This confirms the foundation is live and your session works.
          </Text>
        </Card>
      </View>
    </Screen>
  )
}
