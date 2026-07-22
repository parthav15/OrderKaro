import { useState } from "react"
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from "react-native"
import { useRouter } from "expo-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MotiView } from "moti"
import { SafeAreaView } from "react-native-safe-area-context"
import * as Haptics from "expo-haptics"
import { Clock, Receipt, Banknote, X } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { ownerApi } from "@/lib/owner-api"
import { useOwnerRestaurant } from "@/lib/use-owner-restaurant"
import { useTheme } from "@/theme/theme-provider"
import type { ActiveOrder, AnalyticsSummary, OrderStatus } from "@/lib/types"

const NEXT: Partial<Record<OrderStatus, { label: string; to: OrderStatus }>> = {
  PLACED: { label: "Accept", to: "ACCEPTED" },
  ACCEPTED: { label: "Start preparing", to: "PREPARING" },
  PREPARING: { label: "Mark ready", to: "READY" },
}

interface CashResult {
  orderNumber: number
  consumerName: string | null
  orderAmount: string
  amountReceived: string
  changeAmount: string
  newWalletBalance: string
}

function money(v: string | number) {
  return `₹${Math.round(Number(v))}`
}

function minutesAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  return mins <= 0 ? "just now" : `${mins} min ago`
}

export default function OwnerOrders() {
  const router = useRouter()
  const { colors } = useTheme()
  const queryClient = useQueryClient()
  const { restaurant } = useOwnerRestaurant()
  const rid = restaurant?.id

  const [cashOrder, setCashOrder] = useState<ActiveOrder | null>(null)
  const [cashInput, setCashInput] = useState("")
  const [cashResult, setCashResult] = useState<CashResult | null>(null)

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

  const collectCash = useMutation({
    mutationFn: ({ orderId, amountReceived }: { orderId: string; amountReceived: number }) =>
      ownerApi.post<CashResult>(
        `/api/v1/restaurants/${rid}/orders/${orderId}/collect-cash`,
        { amountReceived }
      ),
    onSuccess: (result) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setCashOrder(null)
      setCashInput("")
      setCashResult(result)
      queryClient.invalidateQueries({ queryKey: ["owner-active", rid] })
      queryClient.invalidateQueries({ queryKey: ["owner-summary", rid] })
    },
  })

  const KPIS = [
    { label: "Today's orders", value: summary ? String(summary.todayOrders) : "—" },
    { label: "Today's revenue", value: summary ? money(summary.todayRevenue) : "—" },
    { label: "Active now", value: summary ? String(summary.activeOrders) : "—" },
  ]

  const cashAmount = Number(cashInput || 0)
  const cashDue = cashOrder ? Number(cashOrder.totalAmount) : 0
  const cashChange = Math.max(0, cashAmount - cashDue)

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <View className="flex-row items-center justify-between px-5 pb-4">
        <View>
          <Text variant="muted" className="text-xs tracking-widest uppercase">
            Live orders
          </Text>
          <Text variant="heading" className="text-2xl">
            {restaurant?.name ?? "Orders"}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/(owner)/order-history")}
          className="flex-row items-center gap-1.5 h-10 px-3.5 rounded-full bg-surface border border-line"
        >
          <Receipt size={16} color={colors.muted} />
          <Text variant="label" className="text-sm">
            History
          </Text>
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
                const canCancel = order.status === "PLACED"
                const canCollect =
                  order.paymentMethod === "CASH" && order.paymentStatus !== "PAID"
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

                    {canCollect ? (
                      <View className="mt-4">
                        <Button
                          title="Collect cash"
                          variant="outline"
                          onPress={() => {
                            setCashOrder(order)
                            setCashInput("")
                          }}
                        />
                      </View>
                    ) : null}

                    {next ? (
                      <View className="flex-row gap-2 mt-2.5">
                        {canCancel ? (
                          <View className="flex-1">
                            <Button
                              title="Decline"
                              variant="outline"
                              onPress={() => advance.mutate({ orderId: order.id, to: "CANCELLED" })}
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

      <Modal
        visible={!!cashOrder}
        transparent
        animationType="fade"
        onRequestClose={() => setCashOrder(null)}
      >
        <Pressable
          onPress={() => setCashOrder(null)}
          className="flex-1 bg-black/60 items-center justify-center px-6"
        >
          <Pressable className="w-full bg-surface rounded-3xl border border-line p-6">
            <View className="flex-row items-center justify-between mb-5">
              <Text variant="heading" className="text-xl">
                Collect cash · #{cashOrder?.orderNumber}
              </Text>
              <Pressable onPress={() => setCashOrder(null)}>
                <X size={20} color={colors.muted} />
              </Pressable>
            </View>

            <View className="flex-row justify-between mb-3">
              <Text variant="muted" className="text-base">
                Order total
              </Text>
              <Text variant="title" className="text-base">
                {money(cashDue)}
              </Text>
            </View>

            <Text variant="muted" className="text-xs uppercase tracking-widest mb-2">
              Amount received
            </Text>
            <TextInput
              value={cashInput}
              onChangeText={(t) => setCashInput(t.replace(/[^\d]/g, ""))}
              placeholder="0"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              autoFocus
              className="h-14 rounded-2xl bg-canvas border border-line px-5 text-ink font-sans-bold text-2xl mb-3"
            />

            <View className="flex-row justify-between mb-5">
              <Text variant="muted" className="text-base">
                Change to return
              </Text>
              <Text variant="price" className="text-lg">
                {money(cashChange)}
              </Text>
            </View>

            <Button
              title="Confirm payment"
              loading={collectCash.isPending}
              disabled={cashAmount < cashDue}
              onPress={() =>
                cashOrder &&
                collectCash.mutate({ orderId: cashOrder.id, amountReceived: cashAmount })
              }
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={!!cashResult}
        transparent
        animationType="fade"
        onRequestClose={() => setCashResult(null)}
      >
        <Pressable
          onPress={() => setCashResult(null)}
          className="flex-1 bg-black/60 items-center justify-center px-6"
        >
          <Pressable className="w-full bg-surface rounded-3xl border border-line p-6 items-center">
            <View className="w-14 h-14 rounded-full bg-primary/15 items-center justify-center mb-4">
              <Banknote size={26} color={colors.primary} />
            </View>
            <Text variant="heading" className="text-xl mb-1">
              Payment collected
            </Text>
            <Text variant="muted" className="text-base text-center mb-5">
              #{cashResult?.orderNumber}
              {cashResult?.consumerName ? ` · ${cashResult.consumerName}` : ""}
            </Text>
            {cashResult && Number(cashResult.changeAmount) > 0 ? (
              <View className="w-full bg-canvas rounded-2xl border border-line p-4 mb-5">
                <Text variant="body" className="text-base text-center">
                  Return {money(cashResult.changeAmount)} change, or it was credited to their
                  wallet (new balance {money(cashResult.newWalletBalance)}).
                </Text>
              </View>
            ) : null}
            <Button title="Done" onPress={() => setCashResult(null)} />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}
