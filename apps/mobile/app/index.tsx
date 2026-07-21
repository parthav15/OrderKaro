import { View, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { MotiView } from "moti"
import { UtensilsCrossed, Store, ChefHat, ChevronRight } from "lucide-react-native"
import { Screen } from "@/components/ui/screen"
import { Text } from "@/components/ui/text"
import { useTheme } from "@/theme/theme-provider"

const ROLES = [
  {
    key: "diner",
    href: "/(diner)",
    title: "I'm dining",
    subtitle: "Browse the menu, order and pay",
    Icon: UtensilsCrossed,
  },
  {
    key: "owner",
    href: "/(owner)",
    title: "I run a restaurant",
    subtitle: "Orders, menu and payments",
    Icon: Store,
  },
  {
    key: "kitchen",
    href: "/(kitchen)",
    title: "Kitchen & counter",
    subtitle: "Live board for staff",
    Icon: ChefHat,
  },
] as const

export default function Entry() {
  const router = useRouter()
  const { colors } = useTheme()

  return (
    <Screen>
      <View className="flex-1 justify-center">
        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 700 }}
          className="mb-12"
        >
          <Text className="text-accent tracking-[4px] text-xs font-sans-semibold mb-3">
            VISION MENU
          </Text>
          <Text variant="display" className="text-5xl leading-tight">
            Dining,
          </Text>
          <Text variant="display" className="text-5xl leading-tight text-primary">
            elevated.
          </Text>
        </MotiView>

        <View className="gap-3">
          {ROLES.map((role, i) => (
            <MotiView
              key={role.key}
              from={{ opacity: 0, translateY: 18 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 180, delay: 200 + i * 90 }}
            >
              <Pressable onPress={() => router.push(role.href)}>
                <View className="flex-row items-center bg-surface rounded-3xl border border-line p-5">
                  <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center mr-4">
                    <role.Icon size={22} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text variant="title" className="text-lg">
                      {role.title}
                    </Text>
                    <Text variant="muted" className="text-sm mt-0.5">
                      {role.subtitle}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.muted} />
                </View>
              </Pressable>
            </MotiView>
          ))}
        </View>
      </View>
    </Screen>
  )
}
