import { useState } from "react"
import { View, ScrollView, Pressable, ActivityIndicator } from "react-native"
import { useRouter } from "expo-router"
import { useMutation } from "@tanstack/react-query"
import { SafeAreaView } from "react-native-safe-area-context"
import { ArrowLeft, RefreshCw } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { PayoutOnboarding } from "@/components/payout-onboarding"
import { StripeConnectOnboarding } from "@/components/stripe-connect-onboarding"
import { ownerApi } from "@/lib/owner-api"
import { useOwnerRestaurant } from "@/lib/use-owner-restaurant"
import { useTheme } from "@/theme/theme-provider"

export default function OwnerPayments() {
  const router = useRouter()
  const { colors } = useTheme()
  const { restaurant } = useOwnerRestaurant()
  const rid = restaurant?.id
  const [reconcileMsg, setReconcileMsg] = useState("")

  const reconcile = useMutation({
    mutationFn: () =>
      ownerApi.post<{ checked: number; confirmed: number }>(
        `/api/v1/restaurants/${rid}/payments/reconcile`
      ),
    onSuccess: (r) =>
      setReconcileMsg(`Checked ${r.checked} pending · confirmed ${r.confirmed} paid`),
  })

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <View className="flex-row items-center gap-3 px-5 pb-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-surface border border-line items-center justify-center"
        >
          <ArrowLeft size={18} color={colors.ink} />
        </Pressable>
        <Text variant="heading" className="text-2xl">
          Payments
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 6, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {!restaurant ? (
          <View className="bg-surface rounded-3xl border border-line p-5 h-44 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : restaurant.country === "IN" ? (
          <PayoutOnboarding restaurant={restaurant} />
        ) : (
          <StripeConnectOnboarding restaurant={restaurant} />
        )}

        {restaurant ? (
          <View className="gap-2 mt-6">
            <Pressable
              onPress={() => {
                setReconcileMsg("")
                reconcile.mutate()
              }}
              className="flex-row items-center justify-center gap-2 h-14 rounded-2xl bg-surface border border-line"
            >
              <RefreshCw size={16} color={colors.ink} />
              <Text variant="label" className="text-base">
                {reconcile.isPending ? "Reconciling…" : "Reconcile pending payments"}
              </Text>
            </Pressable>
            {reconcileMsg ? (
              <Text variant="muted" className="text-sm text-center">
                {reconcileMsg}
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}
