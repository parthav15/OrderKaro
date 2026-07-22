import { View, ScrollView, Pressable, ActivityIndicator } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { MotiView } from "moti"
import { SafeAreaView } from "react-native-safe-area-context"
import { Check, Clock, ChefHat, Bell, X, ArrowLeft } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { useTheme } from "@/theme/theme-provider"
import type { TrackedOrder, OrderStatus } from "@/lib/types"

const STEPS: { key: OrderStatus; label: string; hint: string; Icon: typeof Clock }[] = [
  { key: "PLACED", label: "Order placed", hint: "We've received your order", Icon: Check },
  { key: "ACCEPTED", label: "Accepted", hint: "The kitchen confirmed it", Icon: Clock },
  { key: "PREPARING", label: "Preparing", hint: "Your food is being made", Icon: ChefHat },
  { key: "READY", label: "Ready", hint: "Ready to collect — enjoy!", Icon: Bell },
]

const ORDER: OrderStatus[] = ["PLACED", "ACCEPTED", "PREPARING", "READY"]

export default function TrackScreen() {
  const { token, slug } = useLocalSearchParams<{ token: string; slug: string }>()
  const router = useRouter()
  const { colors } = useTheme()

  const { data, isLoading } = useQuery({
    queryKey: ["track", token],
    queryFn: () => api.get<TrackedOrder>(`/api/v1/public/track/${token}`),
    enabled: !!token,
    refetchInterval: (query) => {
      const s = query.state.data?.status
      return s === "READY" || s === "PICKED_UP" || s === "CANCELLED" ? false : 5000
    },
  })

  if (isLoading || !data) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
        <View className="px-6 pt-1">
          <Pressable
            onPress={() => router.replace(`/(diner)/r/${slug}/menu`)}
            className="w-10 h-10 rounded-full bg-surface border border-line items-center justify-center"
          >
            <ArrowLeft size={18} color={colors.ink} />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  const cancelled = data.status === "CANCELLED"
  const currentIndex = data.status === "PICKED_UP" ? STEPS.length - 1 : ORDER.indexOf(data.status)

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-canvas">
      <View className="px-6 pt-1">
        <Pressable
          onPress={() => router.replace(`/(diner)/r/${slug}/menu`)}
          className="w-10 h-10 rounded-full bg-surface border border-line items-center justify-center"
        >
          <ArrowLeft size={18} color={colors.ink} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        <View className="items-center mb-10 mt-6">
          <Text variant="muted" className="text-xs tracking-widest uppercase mb-2">
            {data.restaurant.name}
          </Text>
          <Text variant="display" className="text-5xl" style={{ color: colors.primary }}>
            #{data.orderNumber}
          </Text>
          <Text variant="muted" className="text-base mt-2">
            {cancelled
              ? "This order was cancelled"
              : data.status === "READY" || data.status === "PICKED_UP"
                ? "Ready to collect — enjoy!"
                : `Usually ready in ~${data.restaurant.avgPrepTime} min`}
          </Text>
        </View>

        {cancelled ? (
          <View className="items-center py-10">
            <View className="w-16 h-16 rounded-full bg-danger/15 items-center justify-center mb-4">
              <X size={32} color={colors.danger} />
            </View>
          </View>
        ) : (
          <View className="gap-1">
            {STEPS.map((step, i) => {
              const done = i <= currentIndex
              const active = i === currentIndex
              return (
                <View key={step.key} className="flex-row items-start">
                  <View className="items-center mr-4">
                    <MotiView
                      animate={{
                        backgroundColor: done ? colors.primary : colors.surface,
                        scale: active ? 1.1 : 1,
                      }}
                      transition={{ type: "spring", damping: 15 }}
                      className="w-11 h-11 rounded-full items-center justify-center border border-line"
                    >
                      <step.Icon
                        size={18}
                        color={done ? "#FFF7F3" : colors.muted}
                        strokeWidth={2.4}
                      />
                    </MotiView>
                    {i < STEPS.length - 1 ? (
                      <View
                        style={{ backgroundColor: i < currentIndex ? colors.primary : colors.line }}
                        className="w-0.5 h-10 my-1"
                      />
                    ) : null}
                  </View>
                  <View className="flex-1 pt-2">
                    <Text variant={done ? "title" : "muted"} className="text-base">
                      {step.label}
                    </Text>
                    {active ? (
                      <Text variant="muted" className="text-sm mt-0.5">
                        {step.hint}
                      </Text>
                    ) : null}
                  </View>
                </View>
              )
            })}
          </View>
        )}

        <View className="mt-10 bg-surface rounded-3xl border border-line p-5">
          <Text variant="muted" className="text-xs uppercase tracking-widest mb-3">
            Order summary
          </Text>
          {data.items.map((it) => (
            <View key={it.id} className="flex-row justify-between py-1.5">
              <Text variant="body" className="text-base">
                {it.quantity}× {it.menuItem.name}
              </Text>
            </View>
          ))}
          <View className="flex-row justify-between mt-3 pt-3 border-t border-line">
            <Text variant="label" className="text-base">
              Total
            </Text>
            <Text variant="price" className="text-lg">
              ₹{Number(data.totalAmount)}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View className="px-6 pb-4">
        <Button
          title="Back to menu"
          variant="outline"
          onPress={() => router.replace(`/(diner)/r/${slug}/menu`)}
        />
      </View>
    </SafeAreaView>
  )
}
