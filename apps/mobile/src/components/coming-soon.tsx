import { View } from "react-native"
import { useRouter } from "expo-router"
import type { LucideIcon } from "lucide-react-native"
import { Screen } from "@/components/ui/screen"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useTheme } from "@/theme/theme-provider"

export function ComingSoon({
  eyebrow,
  title,
  body,
  Icon,
}: {
  eyebrow: string
  title: string
  body: string
  Icon: LucideIcon
}) {
  const router = useRouter()
  const { colors } = useTheme()

  return (
    <Screen>
      <View className="flex-1 justify-center">
        <Card>
          <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center mb-4">
            <Icon size={22} color={colors.primary} />
          </View>
          <Text className="text-accent tracking-[3px] text-xs font-sans-semibold mb-2">
            {eyebrow}
          </Text>
          <Text variant="heading" className="text-2xl mb-2">
            {title}
          </Text>
          <Text variant="muted" className="text-base leading-relaxed mb-6">
            {body}
          </Text>
          <Button title="Back" variant="outline" onPress={() => router.back()} />
        </Card>
      </View>
    </Screen>
  )
}
