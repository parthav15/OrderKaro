import { useEffect, useRef, useState } from "react"
import { View, ScrollView, Pressable, ActivityIndicator } from "react-native"
import { useRouter } from "expo-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MotiView } from "moti"
import { SafeAreaView } from "react-native-safe-area-context"
import * as Haptics from "expo-haptics"
import { ChefHat, HandPlatter, LogOut, ArrowLeft } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { Screen } from "@/components/ui/screen"
import { Card } from "@/components/ui/card"
import { ownerApi } from "@/lib/owner-api"
import { getOwnerToken, ownerSignOut } from "@/lib/owner-auth"
import { useTheme } from "@/theme/theme-provider"
import type { OwnerRestaurant, ActiveOrder, OrderStatus } from "@/lib/types"

type Mode = "KITCHEN" | "COUNTER"

const KITCHEN_NEXT: Partial<Record<OrderStatus, { label: string; to: OrderStatus }>> = {
  PLACED: { label: "Accept", to: "ACCEPTED" },
  ACCEPTED: { label: "Start", to: "PREPARING" },
  PREPARING: { label: "Ready", to: "READY" },
}

export default function KitchenBoard() {
  const router = useRouter()
  const { colors } = useTheme()
  const queryClient = useQueryClient()
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [mode, setMode] = useState<Mode>("KITCHEN")
  const seen = useRef<Set<string>>(new Set())

  useEffect(() => {
    getOwnerToken().then((t) => setAuthed(!!t))
  }, [])

  const { data: restaurants } = useQuery({
    queryKey: ["owner-restaurants"],
    queryFn: () => ownerApi.get<OwnerRestaurant[]>("/api/v1/restaurants"),
    enabled: authed === true,
  })
  const rid = restaurants?.[0]?.id

  const { data: orders, isLoading } = useQuery({
    queryKey: ["kitchen-active", rid],
    queryFn: () => ownerApi.get<ActiveOrder[]>(`/api/v1/restaurants/${rid}/orders/active`),
    enabled: !!rid,
    refetchInterval: 10000,
  })

  useEffect(() => {
    if (!orders) return
    const incoming = orders.filter((o) => o.status === "PLACED").map((o) => o.id)
    const fresh = incoming.some((id) => !seen.current.has(id))
    if (fresh && seen.current.size > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    }
    seen.current = new Set(orders.map((o) => o.id))
  }, [orders])

  const advance = useMutation({
    mutationFn: ({ orderId, to }: { orderId: string; to: OrderStatus }) =>
      ownerApi.patch(`/api/v1/restaurants/${rid}/orders/${orderId}/status`, { status: to }),
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      queryClient.invalidateQueries({ queryKey: ["kitchen-active", rid] })
    },
  })

  if (authed === false) {
    return (
      <Screen>
        <View className="pt-1 pb-1">
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            className="w-10 h-10 rounded-full bg-surface border border-line items-center justify-center"
          >
            <ArrowLeft size={18} color={colors.ink} />
          </Pressable>
        </View>
        <View className="flex-1 justify-center">
          <Card>
            <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center mb-4">
              <ChefHat size={22} color={colors.primary} />
            </View>
            <Text variant="heading" className="text-2xl mb-2">
              Kitchen & counter
            </Text>
            <Text variant="muted" className="text-base leading-relaxed mb-6">
              Sign in with your restaurant account to open the live board on this device.
            </Text>
            <Button title="Sign in" onPress={() => router.replace("/(owner)")} />
          </Card>
        </View>
      </Screen>
    )
  }

  if (authed === null || isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-canvas items-center justify-center">
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    )
  }

  const visible = (orders ?? []).filter((o) =>
    mode === "COUNTER" ? o.status === "READY" : o.status !== "READY"
  )

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <View className="flex-row items-center justify-between px-5 pb-4">
        <View className="flex-row bg-surface rounded-full border border-line p-1">
          {(["KITCHEN", "COUNTER"] as Mode[]).map((m) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              className={`flex-row items-center gap-2 px-5 py-2.5 rounded-full ${
                mode === m ? "bg-primary" : ""
              }`}
            >
              {m === "KITCHEN" ? (
                <ChefHat size={16} color={mode === m ? "#FFF7F3" : colors.muted} />
              ) : (
                <HandPlatter size={16} color={mode === m ? "#FFF7F3" : colors.muted} />
              )}
              <Text className={`text-sm font-sans-bold ${mode === m ? "text-[#FFF7F3]" : "text-muted"}`}>
                {m === "KITCHEN" ? "Kitchen" : "Counter"}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={async () => {
            await ownerSignOut()
            setAuthed(false)
          }}
          className="w-11 h-11 rounded-full bg-surface border border-line items-center justify-center"
        >
          <LogOut size={18} color={colors.muted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {visible.length === 0 ? (
          <View className="items-center py-32">
            <Text variant="title" className="text-xl mb-1">
              {mode === "COUNTER" ? "Nothing ready yet" : "No orders cooking"}
            </Text>
            <Text variant="muted" className="text-base">
              New tickets appear here automatically.
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-3">
            {visible.map((order, i) => {
              const next = mode === "COUNTER" ? { label: "Picked up", to: "PICKED_UP" as OrderStatus } : KITCHEN_NEXT[order.status]
              const urgent = order.status === "PLACED"
              return (
                <MotiView
                  key={order.id}
                  from={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", damping: 18, stiffness: 200, delay: i * 40 }}
                  style={{ width: "48%" }}
                  className={`bg-surface rounded-3xl border p-4 ${
                    urgent ? "border-primary" : "border-line"
                  }`}
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <Text variant="heading" className="text-2xl">
                      #{order.orderNumber}
                    </Text>
                    <View className="rounded-full bg-canvas border border-line px-2.5 py-0.5">
                      <Text variant="muted" className="text-[10px] uppercase tracking-wide">
                        {order.table?.label ?? order.orderType.replace("_", "-")}
                      </Text>
                    </View>
                  </View>
                  <View className="mb-4 min-h-[64px]">
                    {order.items.map((it) => (
                      <Text key={it.id} variant="label" className="text-base leading-relaxed">
                        {it.quantity}× {it.menuItem.name}
                      </Text>
                    ))}
                  </View>
                  {next ? (
                    <Button
                      title={next.label}
                      loading={advance.isPending && advance.variables?.orderId === order.id}
                      onPress={() => advance.mutate({ orderId: order.id, to: next.to })}
                    />
                  ) : (
                    <View className="h-14 items-center justify-center rounded-2xl bg-canvas border border-line">
                      <Text variant="muted" className="text-sm uppercase tracking-widest">
                        {order.status}
                      </Text>
                    </View>
                  )}
                </MotiView>
              )
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
