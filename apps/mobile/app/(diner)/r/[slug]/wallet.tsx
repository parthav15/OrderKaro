import { useState } from "react"
import { View, Pressable, TextInput, ActivityIndicator } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { SafeAreaView } from "react-native-safe-area-context"
import { ArrowLeft, Wallet as WalletIcon } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PaymentSheet } from "@/components/payment-sheet"
import { api } from "@/lib/api"
import { useCart } from "@/stores/cart"
import { useTheme } from "@/theme/theme-provider"
import type { PaymentSession } from "@/lib/types"

const QUICK = [100, 200, 500]

export default function WalletScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()
  const { colors } = useTheme()
  const restaurantId = useCart((s) => s.restaurantId)

  const [amount, setAmount] = useState("")
  const [busy, setBusy] = useState(false)
  const [session, setSession] = useState<PaymentSession | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["wallet", slug],
    queryFn: () => api.get<{ balance: string }>(`/api/v1/consumer/wallet?slug=${slug}`, true),
    enabled: !!slug,
  })

  async function topUp() {
    const value = Number(amount)
    if (!restaurantId || !value || value < 1) return
    setBusy(true)
    try {
      const res = await api.post<PaymentSession>(
        `/api/v1/restaurants/${restaurantId}/wallet/topup`,
        { amount: value },
        true
      )
      setSession(res)
    } finally {
      setBusy(false)
    }
  }

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
          Wallet
        </Text>
      </View>

      <View className="px-5 pt-4">
        <Card>
          <View className="flex-row items-center gap-3 mb-2">
            <View className="w-10 h-10 rounded-2xl bg-accent/15 items-center justify-center">
              <WalletIcon size={20} color={colors.accent} />
            </View>
            <Text variant="muted" className="text-sm">
              Balance at this restaurant
            </Text>
          </View>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text variant="heading" className="text-5xl">
              ₹{Number(data?.balance ?? 0)}
            </Text>
          )}
        </Card>

        <Text variant="label" className="text-sm mt-8 mb-3">
          Add money
        </Text>
        <View className="flex-row gap-2 mb-3">
          {QUICK.map((q) => (
            <Pressable
              key={q}
              onPress={() => setAmount(String(q))}
              className={`flex-1 items-center py-3.5 rounded-2xl border ${
                amount === String(q) ? "border-primary bg-primary/10" : "border-line bg-surface"
              }`}
            >
              <Text variant={amount === String(q) ? "label" : "body"} className="text-base">
                ₹{q}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          value={amount}
          onChangeText={(t) => setAmount(t.replace(/\D/g, ""))}
          placeholder="Custom amount"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          className="h-14 rounded-2xl bg-surface border border-line px-5 text-ink font-sans-medium text-base mb-5"
        />
        <Button
          title={amount ? `Add ₹${amount}` : "Add money"}
          loading={busy}
          disabled={!amount || Number(amount) < 1}
          onPress={topUp}
        />
      </View>

      <PaymentSheet
        session={session}
        title="Add money"
        onSuccess={() => {
          setSession(null)
          refetch()
        }}
        onClose={() => setSession(null)}
      />
    </SafeAreaView>
  )
}
