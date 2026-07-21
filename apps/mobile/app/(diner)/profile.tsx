import { useEffect, useState } from "react"
import { View, ScrollView, Pressable, ActivityIndicator } from "react-native"
import { useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { SafeAreaView } from "react-native-safe-area-context"
import { ArrowLeft, LogOut, Wallet as WalletIcon, User } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { getIdentity, signOut, type Identity } from "@/lib/auth"
import { useCart } from "@/stores/cart"
import { useTheme } from "@/theme/theme-provider"
import type { WalletSummary } from "@/lib/types"

export default function Profile() {
  const router = useRouter()
  const { colors } = useTheme()
  const clearCart = useCart((s) => s.clear)
  const [identity, setIdentity] = useState<Identity | null>(null)

  useEffect(() => {
    getIdentity().then(setIdentity)
  }, [])

  const { data: wallets, isLoading } = useQuery({
    queryKey: ["all-wallets"],
    queryFn: () => api.get<{ wallets: WalletSummary[] }>("/api/v1/consumer/wallet", true),
  })

  async function handleSignOut() {
    await signOut()
    clearCart()
    router.replace("/")
  }

  const funded = (wallets?.wallets ?? []).filter((w) => Number(w.balance) > 0)

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <View className="flex-row items-center px-5 pb-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-surface border border-line items-center justify-center mr-3"
        >
          <ArrowLeft size={20} color={colors.ink} />
        </Pressable>
        <Text variant="heading" className="text-2xl">
          Profile
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Card>
          <View className="flex-row items-center gap-4">
            <View className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center">
              <User size={26} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text variant="heading" className="text-xl">
                {identity?.name ?? "Guest"}
              </Text>
              <Text variant="muted" className="text-base mt-0.5">
                {identity?.phone ?? ""}
              </Text>
            </View>
          </View>
        </Card>

        <Text variant="muted" className="text-xs uppercase tracking-widest mt-8 mb-3">
          Your wallets
        </Text>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} className="my-6" />
        ) : funded.length === 0 ? (
          <View className="bg-surface rounded-2xl border border-line p-5">
            <Text variant="muted" className="text-base">
              No wallet balance yet. Top up from a restaurant's menu to pay faster next time.
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {funded.map((w) => (
              <Pressable
                key={w.id}
                onPress={() =>
                  router.push({
                    pathname: "/(diner)/r/[slug]/wallet",
                    params: { slug: w.restaurant.slug },
                  })
                }
              >
                <View className="flex-row items-center bg-surface rounded-2xl border border-line p-4">
                  <View className="w-10 h-10 rounded-2xl bg-accent/15 items-center justify-center mr-3">
                    <WalletIcon size={18} color={colors.accent} />
                  </View>
                  <Text variant="title" className="text-base flex-1">
                    {w.restaurant.name}
                  </Text>
                  <Text variant="price" className="text-lg">
                    ₹{Number(w.balance)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View className="mt-10">
          <Button title="Sign out" variant="outline" onPress={handleSignOut} />
        </View>
        <View className="flex-row items-center justify-center gap-2 mt-6">
          <LogOut size={14} color={colors.muted} />
          <Text variant="muted" className="text-xs">
            Vision Menu
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
