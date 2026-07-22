import { View, ScrollView, Pressable, ActivityIndicator } from "react-native"
import { useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { MotiView } from "moti"
import { SafeAreaView } from "react-native-safe-area-context"
import { ArrowLeft, Receipt, ChevronRight, RotateCcw } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { api } from "@/lib/api"
import { useCart } from "@/stores/cart"
import { useTheme } from "@/theme/theme-provider"
import type { ConsumerOrder, OrderStatus } from "@/lib/types"

const LIVE: OrderStatus[] = ["AWAITING_PAYMENT", "PLACED", "ACCEPTED", "PREPARING", "READY"]

const STATUS_LABEL: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: "Awaiting payment",
  PLACED: "Placed",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY: "Ready",
  PICKED_UP: "Completed",
  CANCELLED: "Cancelled",
}

function statusColor(status: OrderStatus, colors: { success: string; warning: string; muted: string; danger: string }) {
  if (status === "PICKED_UP") return colors.success
  if (status === "CANCELLED") return colors.danger
  if (LIVE.includes(status)) return colors.warning
  return colors.muted
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) +
    " · " + d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
}

export default function Orders() {
  const router = useRouter()
  const { colors } = useTheme()
  const { setContext, clear, addLine } = useCart()

  const { data, isLoading } = useQuery({
    queryKey: ["consumer-orders"],
    queryFn: () => api.get<ConsumerOrder[]>("/api/v1/consumer/orders", true),
  })

  function orderAgain(order: ConsumerOrder) {
    clear()
    setContext(order.restaurantId, order.restaurant.slug, null)
    order.items.forEach((it) =>
      addLine({
        menuItemId: it.menuItemId,
        name: it.menuItem.name,
        basePrice: Number(it.unitPrice),
        quantity: it.quantity,
        imageUrl: null,
        isVeg: true,
        selectedOptions: [],
      })
    )
    router.push({ pathname: "/(diner)/r/[slug]/cart", params: { slug: order.restaurant.slug } })
  }

  function openOrder(order: ConsumerOrder) {
    if (order.trackingToken) {
      router.push({
        pathname: "/(diner)/r/[slug]/track/[token]",
        params: { slug: order.restaurant.slug, token: order.trackingToken },
      })
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
          Your orders
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !data || data.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Receipt size={44} color={colors.muted} />
          <Text variant="title" className="text-xl mt-4 mb-1">
            No orders yet
          </Text>
          <Text variant="muted" className="text-base text-center">
            Your past orders will show up here.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View className="gap-3">
            {data.map((order, i) => (
              <MotiView
                key={order.id}
                from={{ opacity: 0, translateY: 12 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 200, delay: i * 40 }}
                className="bg-surface rounded-3xl border border-line p-5"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <Text variant="title" className="text-base">
                      {order.restaurant.name}
                    </Text>
                  </View>
                  <Text
                    className="text-xs font-sans-bold uppercase tracking-wide"
                    style={{ color: statusColor(order.status, colors) }}
                  >
                    {STATUS_LABEL[order.status]}
                  </Text>
                </View>
                <Text variant="muted" className="text-sm mb-3">
                  #{order.orderNumber} · {formatDate(order.placedAt)}
                </Text>
                <Text variant="body" className="text-sm mb-3" numberOfLines={2}>
                  {order.items.map((it) => `${it.quantity}× ${it.menuItem.name}`).join(", ")}
                </Text>
                <View className="flex-row items-center justify-between pt-3 border-t border-line">
                  <Text variant="price" className="text-lg">
                    ₹{Number(order.totalAmount)}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <Pressable
                      onPress={() => orderAgain(order)}
                      className="flex-row items-center gap-1.5 rounded-full border border-line px-3.5 py-2"
                    >
                      <RotateCcw size={14} color={colors.ink} />
                      <Text variant="label" className="text-sm">
                        Order again
                      </Text>
                    </Pressable>
                    {order.trackingToken && LIVE.includes(order.status) ? (
                      <Pressable
                        onPress={() => openOrder(order)}
                        style={{ backgroundColor: colors.primary }}
                        className="flex-row items-center gap-1 rounded-full px-3.5 py-2"
                      >
                        <Text className="font-sans-semibold text-sm" style={{ color: colors.onPrimary }}>Track</Text>
                        <ChevronRight size={14} color="#FFF7F3" />
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </MotiView>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
