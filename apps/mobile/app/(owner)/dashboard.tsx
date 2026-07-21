import { View, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native"
import { useRouter } from "expo-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MotiView } from "moti"
import { SafeAreaView } from "react-native-safe-area-context"
import * as Haptics from "expo-haptics"
import { LogOut, Clock } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { ownerApi } from "@/lib/owner-api"
import { ownerSignOut } from "@/lib/owner-auth"
import { useTheme } from "@/theme/theme-provider"
import type { OwnerRestaurant, ActiveOrder, AnalyticsSummary, OrderStatus } from "@/lib/types"

const NEXT: Partial<Record<OrderStatus, { label: string; to: OrderStatus }>> = {
  PLACED: { label: "Accept", to: "ACCEPTED" },
  ACCEPTED: { label: "Start preparing", to: "PREPARING" },
  PREPARING: { label: "Mark ready", to: "READY" },
  READY: { label: "Picked up", to: "PICKED_UP" },
}

function money(v: string | number) {
  return `₹${Math.round(Number(v))}`
}

function minutesAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  return mins <= 0 ? "just now" : `${mins} min ago`
}

export default function Dashboard() {
  const router = useRouter()
  const { colors } = useTheme()
  const queryClient = useQueryClient()

  const { data: restaurants } = useQuery({
    queryKey: ["owner-restaurants"],
    queryFn: () => ownerApi.get<OwnerRestaurant[]>("/api/v1/restaurants"),
  })
  const restaurant = restaurants?.[0]
  const rid = restaurant?.id

  const { data: summary } = useQuery({
    queryKey: ["owner-summary", rid],
    queryFn: () => ownerApi.get<AnalyticsSummary>(`/api/v1/restaurants/${rid}/analytics/summary`),
    enabled: !!rid,
    refetchInterval: 30000,
  })

  const { data: orders, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["owner-active", rid],
    queryFn: () => ownerApi.get<ActiveOrder[]>(`/api/v1/restaurants/${rid}/orders/active`),
    enabled: !!rid,
    refetchInterval: 15000,
  })

  const advance = useMutation({
    mutationFn: ({ orderId, to }: { orderId: string; to: OrderStatus }) =>
      ownerApi.patch(`/api/v1/restaurants/${rid}/orders/${orderId}/status`, { status: to }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      queryClient.invalidateQueries({ queryKey: ["owner-active", rid] })
      queryClient.invalidateQueries({ queryKey: ["owner-summary", rid] })
    },
  })

  async function signOut() {
    await ownerSignOut()
    router.replace("/(owner)")
  }

  const KPIS = [
    { label: "Today's orders", value: summary ? String(summary.todayOrders) : "—" },
    { label: "Today's revenue", value: summary ? money(summary.todayRevenue) : "—" },
    { label: "Active now", value: summary ? String(summary.activeOrders) : "—" },
  ]

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <View className="flex-row items-center justify-between px-5 pb-4">
        <View>
          <Text variant="muted" className="text-xs tracking-widest uppercase">
            Live orders
          </Text>
          <Text variant="heading" className="text-2xl">
            {restaurant?.name ?? "Dashboard"}
          </Text>
        </View>
        <Pressable
          onPress={signOut}
          className="w-10 h-10 rounded-full bg-surface border border-line items-center justify-center"
        >
          <LogOut size={18} color={colors.muted} />
        </Pressable>
      </View>

      <View className="flex-row gap-2 px-5 mb-4">
        {KPIS.map((kpi) => (
          <View key={kpi.label} className="flex-1 bg-surface rounded-2xl border border-line p-3">
            <Text variant="muted" className="text-[11px] mb-1">
              {kpi.label}
            </Text>
            <Text variant="title" className="text-xl">
              {kpi.value}
            </Text>
          </View>
        ))}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingTop: 4, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
        >
          {!orders || orders.length === 0 ? (
            <View className="items-center py-24">
              <Text variant="title" className="text-lg mb-1">
                All caught up
              </Text>
              <Text variant="muted" className="text-base">
                New orders will appear here automatically.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {orders.map((order, i) => {
                const next = NEXT[order.status]
                return (
                  <MotiView
                    key={order.id}
                    from={{ opacity: 0, translateY: 12 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 200, delay: i * 40 }}
                    className="bg-surface rounded-3xl border border-line p-5"
                  >
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center gap-2">
                        <Text variant="heading" className="text-xl">
                          #{order.orderNumber}
                        </Text>
                        <View className="rounded-full bg-canvas border border-line px-2.5 py-0.5">
                          <Text variant="muted" className="text-[11px] uppercase tracking-wide">
                            {order.table?.label ?? order.orderType.replace("_", "-")}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Clock size={12} color={colors.muted} />
                        <Text variant="muted" className="text-xs">
                          {minutesAgo(order.placedAt)}
                        </Text>
                      </View>
                    </View>

                    <View className="mb-4">
                      {order.items.map((it) => (
                        <Text key={it.id} variant="body" className="text-base leading-relaxed">
                          {it.quantity}× {it.menuItem.name}
                        </Text>
                      ))}
                      {order.specialInstructions ? (
                        <Text variant="muted" className="text-sm mt-1 italic">
                          "{order.specialInstructions}"
                        </Text>
                      ) : null}
                    </View>

                    <View className="flex-row items-center justify-between">
                      <Text variant="price" className="text-lg">
                        {money(order.totalAmount)}
                        <Text variant="muted" className="text-xs">
                          {"  "}
                          {order.paymentMethod}
                          {order.paymentStatus === "PAID" ? " · paid" : ""}
                        </Text>
                      </Text>
                    </View>

                    {next ? (
                      <View className="flex-row gap-2 mt-4">
                        {(order.status === "PLACED" || order.status === "ACCEPTED") ? (
                          <View className="flex-1">
                            <Button
                              title="Decline"
                              variant="outline"
                              onPress={() =>
                                advance.mutate({ orderId: order.id, to: "CANCELLED" })
                              }
                            />
                          </View>
                        ) : null}
                        <View className="flex-[2]">
                          <Button
                            title={next.label}
                            loading={advance.isPending && advance.variables?.orderId === order.id}
                            onPress={() => advance.mutate({ orderId: order.id, to: next.to })}
                          />
                        </View>
                      </View>
                    ) : null}
                  </MotiView>
                )
              })}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
