import { useState } from "react"
import { View, ScrollView, Pressable, ActivityIndicator } from "react-native"
import { useRouter } from "expo-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { SafeAreaView } from "react-native-safe-area-context"
import { ArrowLeft, Check, Minus } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { PaymentSheet } from "@/components/payment-sheet"
import { ownerApi } from "@/lib/owner-api"
import { useOwnerRestaurant } from "@/lib/use-owner-restaurant"
import { useTheme } from "@/theme/theme-provider"
import type { BillingInfo, PlanDefinition, PlanFeatures, PaymentSession } from "@/lib/types"

const FEATURE_LABELS: Array<{ key: keyof PlanFeatures; label: string }> = [
  { key: "branding", label: "Custom branding" },
  { key: "delivery", label: "Delivery orders" },
  { key: "viewAnalytics", label: "View analytics" },
  { key: "ar", label: "AR menu" },
]

function money(v: number) {
  return v === 0 ? "Free" : `₹${v}/mo`
}

function Meter({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (used / max) * 100) : 0
  return (
    <View className="mb-3">
      <View className="flex-row justify-between mb-1">
        <Text variant="body" className="text-sm">
          {label}
        </Text>
        <Text variant="muted" className="text-sm">
          {used} / {max}
        </Text>
      </View>
      <View className="h-2 rounded-full bg-canvas overflow-hidden">
        <View
          className={`h-full rounded-full ${pct >= 100 ? "bg-danger" : "bg-primary"}`}
          style={{ width: `${Math.max(3, pct)}%` }}
        />
      </View>
    </View>
  )
}

export default function OwnerBilling() {
  const router = useRouter()
  const { colors } = useTheme()
  const queryClient = useQueryClient()
  const { restaurant } = useOwnerRestaurant()
  const rid = restaurant?.id

  const [session, setSession] = useState<PaymentSession | null>(null)
  const [error, setError] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["owner-billing", rid],
    queryFn: () => ownerApi.get<BillingInfo>(`/api/v1/restaurants/${rid}/billing`),
    enabled: !!rid,
  })

  const checkout = useMutation({
    mutationFn: (plan: string) =>
      ownerApi.post<PaymentSession & { redirectUrl?: string }>(
        `/api/v1/restaurants/${rid}/billing/checkout`,
        { plan }
      ),
    onSuccess: (result) => {
      if (!result?.redirectUrl && !result?.pollUrl) {
        setError("Billing is not available right now. Please try again later.")
        return
      }
      setSession(result)
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not start checkout"),
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
          Billing & plan
        </Text>
      </View>

      {isLoading || !data ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 6, paddingBottom: 40 }}>
          <View className="bg-surface rounded-3xl border border-line p-5 mb-6">
            <View className="flex-row items-center justify-between mb-1">
              <Text variant="heading" className="text-2xl">
                {data.definition.label}
              </Text>
              {data.plan !== "FREE" ? (
                <View className="rounded-full bg-success/15 px-3 py-1">
                  <Text variant="label" className="text-xs text-success">
                    Active
                  </Text>
                </View>
              ) : null}
            </View>
            <Text variant="muted" className="text-sm mb-5">
              {data.plan === "FREE"
                ? "You're on the free plan"
                : data.expired
                ? "Your plan has expired — running on Free limits"
                : `Renews ${data.planValidUntil ? new Date(data.planValidUntil).toLocaleDateString("en-IN") : ""}`}
            </Text>

            <Meter label="Menu items" used={data.usage.menuItems} max={data.usage.maxMenuItems} />
            <Meter label="Tables" used={data.usage.tables} max={data.usage.maxTables} />
          </View>

          {error ? (
            <Text className="text-danger font-sans-medium text-sm mb-4">{error}</Text>
          ) : null}

          <Text variant="muted" className="text-xs tracking-widest uppercase mb-3 px-1">
            Plans
          </Text>
          <View className="gap-3">
            {data.catalogue.map((plan: PlanDefinition) => {
              const isCurrent = plan.name === data.plan
              return (
                <View
                  key={plan.name}
                  className={`bg-surface rounded-3xl border p-5 ${
                    isCurrent ? "border-primary" : "border-line"
                  }`}
                >
                  <View className="flex-row items-center justify-between mb-4">
                    <View>
                      <Text variant="heading" className="text-xl">
                        {plan.label}
                      </Text>
                      <Text variant="price" className="text-base">
                        {money(plan.monthlyPrice)}
                      </Text>
                    </View>
                    {isCurrent ? (
                      <View className="rounded-full bg-canvas border border-line px-3 py-1">
                        <Text variant="muted" className="text-xs">
                          Current
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View className="gap-1.5 mb-4">
                    <View className="flex-row items-center gap-2">
                      <Check size={14} color={colors.success} />
                      <Text variant="body" className="text-sm">
                        Up to {plan.maxMenuItems} items · {plan.maxTables} tables
                      </Text>
                    </View>
                    {FEATURE_LABELS.map((f) => {
                      const on = plan.features[f.key]
                      return (
                        <View key={f.key} className="flex-row items-center gap-2">
                          {on ? (
                            <Check size={14} color={colors.success} />
                          ) : (
                            <Minus size={14} color={colors.muted} />
                          )}
                          <Text
                            variant="body"
                            className={`text-sm ${on ? "" : "text-muted line-through"}`}
                          >
                            {f.label}
                          </Text>
                        </View>
                      )
                    })}
                  </View>

                  {!isCurrent && plan.monthlyPrice > 0 ? (
                    <Button
                      title={`Upgrade to ${plan.label}`}
                      loading={checkout.isPending && checkout.variables === plan.name}
                      onPress={() => {
                        setError("")
                        checkout.mutate(plan.name)
                      }}
                    />
                  ) : null}
                </View>
              )
            })}
          </View>
        </ScrollView>
      )}

      <PaymentSheet
        session={session}
        title="Subscription"
        onSuccess={() => {
          setSession(null)
          queryClient.invalidateQueries({ queryKey: ["owner-billing", rid] })
          queryClient.invalidateQueries({ queryKey: ["owner-restaurants"] })
        }}
        onClose={() => setSession(null)}
      />
    </SafeAreaView>
  )
}
