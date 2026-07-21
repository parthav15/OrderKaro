import { useEffect, useState } from "react"
import { View, ScrollView, Pressable } from "react-native"
import { useRouter, type Href } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import {
  QrCode,
  Users,
  Wallet,
  Banknote,
  Settings,
  Megaphone,
  ChevronRight,
  LogOut,
} from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { ownerSignOut, getOwnerProfile, type OwnerProfile } from "@/lib/owner-auth"
import { useOwnerRestaurant } from "@/lib/use-owner-restaurant"
import { useTheme } from "@/theme/theme-provider"

interface Row {
  label: string
  hint: string
  icon: typeof QrCode
  href: Href
}

const GROUPS: Array<{ title: string; rows: Row[] }> = [
  {
    title: "Operations",
    rows: [
      { label: "Tables & QR", hint: "Codes for every table", icon: QrCode, href: "/(owner)/tables" },
      { label: "Staff", hint: "Kitchen, counter, managers", icon: Users, href: "/(owner)/staff" },
    ],
  },
  {
    title: "Money",
    rows: [
      { label: "Wallet", hint: "Credits & recharge requests", icon: Wallet, href: "/(owner)/wallet" },
      { label: "Payments", hint: "Connect your gateway", icon: Banknote, href: "/(owner)/payments" },
    ],
  },
  {
    title: "Restaurant",
    rows: [
      { label: "Settings", hint: "Profile, branding, delivery", icon: Settings, href: "/(owner)/settings" },
      { label: "Announcements", hint: "Banners on your menu", icon: Megaphone, href: "/(owner)/announcements" },
    ],
  },
]

export default function OwnerMore() {
  const router = useRouter()
  const { colors } = useTheme()
  const { restaurant } = useOwnerRestaurant()
  const [profile, setProfile] = useState<OwnerProfile | null>(null)

  useEffect(() => {
    getOwnerProfile().then(setProfile)
  }, [])

  async function signOut() {
    await ownerSignOut()
    router.replace("/(owner)")
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View className="mb-6">
          <Text variant="muted" className="text-xs tracking-widest uppercase mb-1">
            Console
          </Text>
          <Text variant="heading" className="text-3xl">
            {restaurant?.name ?? "Your restaurant"}
          </Text>
          {profile ? (
            <Text variant="muted" className="text-sm mt-1">
              {profile.name} · {profile.email}
            </Text>
          ) : null}
        </View>

        {GROUPS.map((group) => (
          <View key={group.title} className="mb-6">
            <Text variant="muted" className="text-xs tracking-widest uppercase mb-2 px-1">
              {group.title}
            </Text>
            <View className="bg-surface rounded-3xl border border-line overflow-hidden">
              {group.rows.map((row, i) => {
                const Icon = row.icon
                return (
                  <Pressable
                    key={row.label}
                    onPress={() => router.push(row.href)}
                    className={`flex-row items-center gap-4 px-4 py-4 ${
                      i > 0 ? "border-t border-line" : ""
                    }`}
                  >
                    <View className="w-10 h-10 rounded-2xl bg-canvas border border-line items-center justify-center">
                      <Icon size={18} color={colors.primary} />
                    </View>
                    <View className="flex-1">
                      <Text variant="title" className="text-base">
                        {row.label}
                      </Text>
                      <Text variant="muted" className="text-xs">
                        {row.hint}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={colors.muted} />
                  </Pressable>
                )
              })}
            </View>
          </View>
        ))}

        <Pressable
          onPress={signOut}
          className="flex-row items-center justify-center gap-2 h-14 rounded-2xl bg-surface border border-line"
        >
          <LogOut size={18} color={colors.danger} />
          <Text variant="label" className="text-base text-danger">
            Sign out
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}
