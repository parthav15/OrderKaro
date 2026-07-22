import { useEffect, useState } from "react"
import { View, Pressable } from "react-native"
import { useRouter, type Href } from "expo-router"
import { MotiView } from "moti"
import * as SecureStore from "expo-secure-store"
import { UtensilsCrossed, Store, ChefHat, ArrowUpRight } from "lucide-react-native"
import { Screen } from "@/components/ui/screen"
import { Text } from "@/components/ui/text"
import { useTheme } from "@/theme/theme-provider"

interface Role {
  key: string
  href: Href
  title: string
  subtitle: string
  Icon: typeof UtensilsCrossed
}

const ROLES: Role[] = [
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
    subtitle: "Orders, menu, payments and more",
    Icon: Store,
  },
  {
    key: "kitchen",
    href: "/(kitchen)",
    title: "Kitchen & counter",
    subtitle: "The live board for staff",
    Icon: ChefHat,
  },
]

function RoleCard({ role, index, onPress }: { role: Role; index: number; onPress: () => void }) {
  const { colors } = useTheme()
  const [pressed, setPressed] = useState(false)
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 180, delay: 620 + index * 110 }}
    >
      <Pressable
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onPress={onPress}
      >
        <MotiView
          animate={{ scale: pressed ? 0.975 : 1 }}
          transition={{ type: "timing", duration: 140 }}
          className="flex-row items-center bg-surface rounded-[26px] border border-line p-5"
        >
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
          <MotiView
            animate={{ translateX: pressed ? 4 : 0, translateY: pressed ? -4 : 0 }}
            transition={{ type: "timing", duration: 140 }}
          >
            <ArrowUpRight size={20} color={colors.muted} />
          </MotiView>
        </MotiView>
      </Pressable>
    </MotiView>
  )
}

export default function Entry() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    SecureStore.getItemAsync("vm-intro-seen").then((seen) => {
      if (seen) setReady(true)
      else router.replace("/intro")
    })
  }, [])

  if (!ready) return <View className="flex-1 bg-canvas" />

  return (
    <Screen>
      <View className="flex-1">
        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600 }}
          className="flex-row items-center gap-2 pt-2"
        >
          <MotiView
            from={{ opacity: 0.35 }}
            animate={{ opacity: 1 }}
            transition={{ loop: true, type: "timing", duration: 1400 }}
            className="w-1.5 h-1.5 rounded-full bg-accent"
          />
          <Text className="text-accent tracking-[5px] text-[11px] font-sans-bold">
            VISION MENU
          </Text>
        </MotiView>

        <View className="flex-1 justify-center">
          <MotiView
            from={{ opacity: 0, translateY: 24 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 700, delay: 120 }}
          >
            <Text variant="display" className="text-[56px] leading-[1.02]">
              Dining,
            </Text>
          </MotiView>
          <MotiView
            from={{ opacity: 0, translateY: 24 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 700, delay: 260 }}
          >
            <Text variant="display" className="text-[56px] leading-[1.02] text-primary">
              elevated.
            </Text>
          </MotiView>
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 700, delay: 440 }}
          >
            <Text variant="muted" className="text-base mt-5 leading-relaxed">
              Scan, savour and settle up — a beautifully simple way to order.
            </Text>
          </MotiView>
        </View>

        <View className="gap-3 pb-2">
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 500, delay: 560 }}
          >
            <Text variant="muted" className="text-[11px] tracking-widest uppercase mb-1 px-1">
              Continue as
            </Text>
          </MotiView>
          {ROLES.map((role, i) => (
            <RoleCard key={role.key} role={role} index={i} onPress={() => router.push(role.href)} />
          ))}
        </View>

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "timing", duration: 700, delay: 1000 }}
          className="items-center pt-4"
        >
          <Text variant="muted" className="text-xs">
            Premium QR ordering for modern restaurants
          </Text>
        </MotiView>
      </View>
    </Screen>
  )
}
