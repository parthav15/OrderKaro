import { useState } from "react"
import { View, ScrollView, Pressable, ActivityIndicator, Modal } from "react-native"
import { useRouter } from "expo-router"
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { SafeAreaView } from "react-native-safe-area-context"
import * as Haptics from "expo-haptics"
import { ArrowLeft, X } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { ownerApi } from "@/lib/owner-api"
import { useOwnerRestaurant } from "@/lib/use-owner-restaurant"
import { useTheme } from "@/theme/theme-provider"
import type { OrderStatus } from "@/lib/types"

const NEXT: Partial<Record<OrderStatus, { label: string; to: OrderStatus }>> = {
  PLACED: { label: "Accept", to: "ACCEPTED" },
  ACCEPTED: { label: "Start preparing", to: "PREPARING" },
  PREPARING: { label: "Mark ready", to: "READY" },
  READY: { label: "Picked up", to: "PICKED_UP" },
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: "Awaiting payment",
  PLACED: "Placed",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY: "Ready",
  PICKED_UP: "Picked up",
  CANCELLED: "Cancelled",
}

const STATUS_FILTERS: Array<{ label: string; value: string }> = [
  { label: "All", value: "" },
  { label: "Placed", value: "PLACED" },
  { label: "Preparing", value: "PREPARING" },
  { label: "Ready", value: "READY" },
  { label: "Picked up", value: "PICKED_UP" },
  { label: "Cancelled", value: "CANCELLED" },
]

const PAYMENT_FILTERS: Array<{ label: string; value: string }> = [
  { label: "Any pay", value: "" },
  { label: "Wallet", value: "WALLET" },
  { label: "Cash", value: "CASH" },
  { label: "Online", value: "ONLINE" },
]

interface HistoryOption {
  id: string
  optionName?: string
  name?: string
}
interface HistoryItem {
  id: string
  quantity: number
  unitPrice: string
  menuItem: { name: string }
  selectedOptions?: HistoryOption[]
}
interface HistoryOrder {
  id: string
  orderNumber: number
  status: OrderStatus
  orderType: "DINE_IN" | "TAKEAWAY" | "DELIVERY"
  totalAmount: string
  paymentMethod: string
  paymentStatus: string
  placedAt: string
  specialInstructions: string | null
  table: { label: string } | null
  consumer?: { name: string | null; phone: string | null } | null
  items: HistoryItem[]
}
interface HistoryPage {
  orders: HistoryOrder[]
  pagination?: { page?: number; limit?: number; total?: number; totalPages?: number }
}

function money(v: string | number) {
  return `₹${Math.round(Number(v))}`
}

function dateLabel(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString([], { day: "numeric", month: "short" }) +
    " · " +
    d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  const { colors } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      className={`h-9 px-3.5 rounded-full items-center justify-center border ${
        active ? "bg-primary border-primary" : "bg-surface border-line"
      }`}
    >
      <Text
        variant="label"
        className="text-[13px]"
        style={{ color: active ? colors.onPrimary : colors.ink }}
      >
        {label}
      </Text>
    </Pressable>
  )
}

export default function OrderHistory() {
  const router = useRouter()
  const { colors } = useTheme()
  const queryClient = useQueryClient()
  const { restaurant } = useOwnerRestaurant()
  const rid = restaurant?.id

  const [status, setStatus] = useState("")
  const [payment, setPayment] = useState("")
  const [detail, setDetail] = useState<HistoryOrder | null>(null)

  const key = ["owner-history", rid, status, payment]

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: key,
    enabled: !!rid,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      const q = new URLSearchParams({ page: String(pageParam), limit: "20" })
      if (status) q.set("status", status)
      if (payment) q.set("paymentMethod", payment)
      return ownerApi.get<HistoryPage>(`/api/v1/restaurants/${rid}/orders/history?${q.toString()}`)
    },
    getNextPageParam: (last) => {
      const pg = last.pagination
      if (!pg) return undefined
      const page = pg.page ?? 1
      const totalPages = pg.totalPages ?? Math.ceil((pg.total ?? 0) / (pg.limit ?? 20))
      return page < totalPages ? page + 1 : undefined
    },
  })

  const orders = data?.pages.flatMap((p) => p.orders) ?? []

  const advance = useMutation({
    mutationFn: ({ orderId, to }: { orderId: string; to: OrderStatus }) =>
      ownerApi.patch(`/api/v1/restaurants/${rid}/orders/${orderId}/status`, { status: to }),
    onSuccess: (_r, vars) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      queryClient.invalidateQueries({ queryKey: ["owner-history", rid] })
      queryClient.invalidateQueries({ queryKey: ["owner-active", rid] })
      setDetail((d) => (d && d.id === vars.orderId ? { ...d, status: vars.to } : d))
    },
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
          Order history
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        className="max-h-11 mb-2"
      >
        {STATUS_FILTERS.map((f) => (
          <Chip
            key={f.value || "all"}
            label={f.label}
            active={status === f.value}
            onPress={() => setStatus(f.value)}
          />
        ))}
      </ScrollView>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        className="max-h-11 mb-2"
      >
        {PAYMENT_FILTERS.map((f) => (
          <Chip
            key={f.value || "any"}
            label={f.label}
            active={payment === f.value}
            onPress={() => setPayment(f.value)}
          />
        ))}
      </ScrollView>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 6, paddingBottom: 40 }}>
          {orders.length === 0 ? (
            <View className="items-center py-24">
              <Text variant="muted" className="text-base">
                No orders match these filters.
              </Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {orders.map((order) => (
                <Pressable
                  key={order.id}
                  onPress={() => setDetail(order)}
                  className="bg-surface rounded-2xl border border-line p-4 flex-row items-center justify-between"
                >
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-0.5">
                      <Text variant="title" className="text-base">
                        #{order.orderNumber}
                      </Text>
                      <Text variant="muted" className="text-xs">
                        {order.table?.label ?? order.orderType.replace("_", "-")}
                      </Text>
                    </View>
                    <Text variant="muted" className="text-xs">
                      {dateLabel(order.placedAt)} · {STATUS_LABEL[order.status]}
                    </Text>
                  </View>
                  <Text variant="price" className="text-base">
                    {money(order.totalAmount)}
                  </Text>
                </Pressable>
              ))}

              {hasNextPage ? (
                <View className="mt-3">
                  <Button
                    title="Load more"
                    variant="outline"
                    loading={isFetchingNextPage}
                    onPress={() => fetchNextPage()}
                  />
                </View>
              ) : null}
            </View>
          )}
        </ScrollView>
      )}

      <Modal
        visible={!!detail}
        transparent
        animationType="slide"
        onRequestClose={() => setDetail(null)}
      >
        <Pressable
          onPress={() => setDetail(null)}
          className="flex-1 bg-black/60 justify-end"
        >
          <Pressable className="bg-surface rounded-t-3xl border-t border-line p-6 pb-10">
            <View className="flex-row items-center justify-between mb-4">
              <Text variant="heading" className="text-2xl">
                #{detail?.orderNumber}
              </Text>
              <Pressable onPress={() => setDetail(null)}>
                <X size={22} color={colors.muted} />
              </Pressable>
            </View>

            {detail ? (
              <>
                <View className="flex-row flex-wrap gap-2 mb-4">
                  <View className="rounded-full bg-canvas border border-line px-3 py-1">
                    <Text variant="muted" className="text-xs">
                      {STATUS_LABEL[detail.status]}
                    </Text>
                  </View>
                  <View className="rounded-full bg-canvas border border-line px-3 py-1">
                    <Text variant="muted" className="text-xs">
                      {detail.table?.label ?? detail.orderType.replace("_", "-")}
                    </Text>
                  </View>
                  <View className="rounded-full bg-canvas border border-line px-3 py-1">
                    <Text variant="muted" className="text-xs">
                      {detail.paymentMethod}
                      {detail.paymentStatus === "PAID" ? " · paid" : ""}
                    </Text>
                  </View>
                </View>

                {detail.consumer?.name || detail.consumer?.phone ? (
                  <Text variant="muted" className="text-sm mb-4">
                    {detail.consumer?.name}
                    {detail.consumer?.phone ? ` · ${detail.consumer.phone}` : ""}
                  </Text>
                ) : null}

                <ScrollView className="max-h-72 mb-4">
                  {detail.items.map((it) => (
                    <View key={it.id} className="flex-row justify-between mb-2.5">
                      <View className="flex-1 pr-3">
                        <Text variant="body" className="text-base">
                          {it.quantity}× {it.menuItem.name}
                        </Text>
                        {it.selectedOptions && it.selectedOptions.length > 0 ? (
                          <Text variant="muted" className="text-xs mt-0.5">
                            {it.selectedOptions.map((o) => o.optionName ?? o.name).join(", ")}
                          </Text>
                        ) : null}
                      </View>
                      <Text variant="muted" className="text-sm">
                        {money(Number(it.unitPrice) * it.quantity)}
                      </Text>
                    </View>
                  ))}
                  {detail.specialInstructions ? (
                    <Text variant="muted" className="text-sm mt-1 italic">
                      "{detail.specialInstructions}"
                    </Text>
                  ) : null}
                </ScrollView>

                <View className="flex-row items-center justify-between mb-5">
                  <Text variant="title" className="text-base">
                    Total
                  </Text>
                  <Text variant="price" className="text-xl">
                    {money(detail.totalAmount)}
                  </Text>
                </View>

                {(() => {
                  const next = NEXT[detail.status]
                  const canCancel = detail.status === "PLACED" || detail.status === "ACCEPTED"
                  if (!next && !canCancel) return null
                  return (
                    <View className="flex-row gap-2">
                      {canCancel ? (
                        <View className="flex-1">
                          <Button
                            title="Cancel"
                            variant="outline"
                            onPress={() => advance.mutate({ orderId: detail.id, to: "CANCELLED" })}
                          />
                        </View>
                      ) : null}
                      {next ? (
                        <View className="flex-[2]">
                          <Button
                            title={next.label}
                            loading={advance.isPending}
                            onPress={() => advance.mutate({ orderId: detail.id, to: next.to })}
                          />
                        </View>
                      ) : null}
                    </View>
                  )
                })()}
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}
