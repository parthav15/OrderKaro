import { View, ScrollView, Pressable, ActivityIndicator } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { MotiView } from "moti"
import { SafeAreaView } from "react-native-safe-area-context"
import { ArrowLeft, Receipt, Clock, Utensils, ShoppingBag, Bike } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { api } from "@/lib/api"
import { useTheme } from "@/theme/theme-provider"
import type { SelectedOption } from "@/stores/cart"
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
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
}

function fulfillmentIcon(orderType: ConsumerOrder["orderType"]) {
  if (orderType === "DINE_IN") return Utensils
  if (orderType === "DELIVERY") return Bike
  return ShoppingBag
}

function fulfillmentLabel(order: OrderDetail) {
  if (order.orderType === "DINE_IN") {
    return order.table?.label ? `Dine-in · ${order.table.label}` : "Dine-in"
  }
  if (order.orderType === "DELIVERY") {
    return order.deliveryLocation ? `Delivery · ${order.deliveryLocation}` : "Delivery"
  }
  return "Takeaway"
}

interface OrderDetailItem {
  id: string
  menuItemId: string
  quantity: number
  unitPrice: string
  totalPrice: string
  selectedOptions?: SelectedOption[]
  menuItem: { name: string }
}

interface OrderDetail extends Omit<ConsumerOrder, "items"> {
  items: OrderDetailItem[]
  paymentMethod?: string
  deliveryLocation?: string | null
  subtotal?: string | null
  deliveryFee?: string | null
  convenienceFee?: string | null
}

export default function OrderDetailScreen() {
  const { slug, orderId } = useLocalSearchParams<{ slug: string; orderId: string }>()
  const router = useRouter()
  const { colors } = useTheme()

  const { data, isLoading } = useQuery({
    queryKey: ["consumer-orders"],
    queryFn: () => api.get<OrderDetail[]>("/api/v1/consumer/orders", true),
  })

  const order = data?.find((o) => o.id === orderId)

  function goBack() {
    if (router.canGoBack()) router.back()
    else router.replace({ pathname: "/(diner)/r/[slug]/menu", params: { slug } })
  }

  const FulfillmentIcon = order ? fulfillmentIcon(order.orderType) : Utensils
  const pillColor = order ? statusColor(order.status, colors) : colors.muted

  const computedSubtotal = order ? order.items.reduce((sum, it) => sum + Number(it.totalPrice), 0) : 0
  const subtotal = order?.subtotal != null ? Number(order.subtotal) : computedSubtotal
  const deliveryFee = order?.deliveryFee != null ? Number(order.deliveryFee) : 0
  const convenienceFee = order?.convenienceFee != null ? Number(order.convenienceFee) : 0
  const total = order ? Number(order.totalAmount) : 0
  const showBreakdown = deliveryFee > 0 || convenienceFee > 0 || Math.abs(subtotal - total) > 0.5

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <View className="flex-row items-center px-5 pb-3">
        <Pressable
          onPress={goBack}
          className="w-10 h-10 rounded-full bg-surface border border-line items-center justify-center"
        >
          <ArrowLeft size={20} color={colors.ink} />
        </Pressable>
      </View>

      {isLoading && !order ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !order ? (
        <View className="flex-1 items-center justify-center px-8 -mt-16">
          <Receipt size={44} color={colors.muted} />
          <Text variant="title" className="text-xl mt-4 mb-1">
            Order not found
          </Text>
          <Text variant="muted" className="text-base text-center">
            We couldn't find this order.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="mb-6"
          >
            <Text variant="muted" className="text-xs tracking-widest uppercase mb-2">
              {order.restaurant.name}
            </Text>
            <View className="flex-row items-center justify-between">
              <Text variant="display" className="text-4xl" style={{ color: colors.primary }}>
                #{order.orderNumber}
              </Text>
              <View className="rounded-full px-3 py-1" style={{ backgroundColor: `${pillColor}26` }}>
                <Text
                  className="text-xs font-sans-bold uppercase tracking-wide"
                  style={{ color: pillColor }}
                >
                  {STATUS_LABEL[order.status]}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2 mt-4">
              <FulfillmentIcon size={16} color={colors.muted} />
              <Text variant="body" className="text-sm">
                {fulfillmentLabel(order)}
              </Text>
            </View>
            <View className="flex-row items-center gap-2 mt-2">
              <Clock size={14} color={colors.muted} />
              <Text variant="muted" className="text-sm">
                {formatDate(order.placedAt)}
              </Text>
            </View>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 200, delay: 80 }}
            className="bg-surface rounded-3xl border border-line p-5"
          >
            <Text variant="muted" className="text-xs uppercase tracking-widest mb-4">
              Items
            </Text>
            <View className="gap-4">
              {order.items.map((it, i) => (
                <MotiView
                  key={it.id}
                  from={{ opacity: 0, translateX: -8 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: "spring", damping: 20, stiffness: 220, delay: 140 + i * 55 }}
                  className="flex-row items-start justify-between"
                >
                  <View className="flex-1 pr-3">
                    <Text variant="title" className="text-base">
                      {it.quantity}× {it.menuItem.name}
                    </Text>
                    {(it.selectedOptions ?? []).map((opt) => (
                      <Text key={opt.customizationId} variant="muted" className="text-xs mt-0.5">
                        {opt.customizationName}: {opt.optionNames.join(", ")}
                      </Text>
                    ))}
                  </View>
                  <View className="items-end">
                    <Text variant="price" className="text-base">
                      ₹{Number(it.unitPrice)}
                    </Text>
                    {it.quantity > 1 ? (
                      <Text variant="muted" className="text-xs mt-0.5">
                        ₹{Number(it.totalPrice)} total
                      </Text>
                    ) : null}
                  </View>
                </MotiView>
              ))}
            </View>

            <View className="mt-5 pt-4 border-t border-line gap-1.5">
              {showBreakdown ? (
                <>
                  <TotalRow label="Subtotal" amount={subtotal} />
                  {deliveryFee > 0 ? <TotalRow label="Delivery fee" amount={deliveryFee} /> : null}
                  {convenienceFee > 0 ? (
                    <TotalRow label="Convenience fee" amount={convenienceFee} />
                  ) : null}
                </>
              ) : null}
              <TotalRow label="Total" amount={total} emphasized />
            </View>

            <View className="flex-row items-center gap-2 mt-4 pt-4 border-t border-line">
              {order.paymentMethod ? (
                <View className="rounded-full border border-line px-3 py-1.5">
                  <Text variant="muted" className="text-xs uppercase tracking-wide">
                    {order.paymentMethod}
                  </Text>
                </View>
              ) : null}
              <View className="rounded-full border border-line px-3 py-1.5">
                <Text
                  className="text-xs uppercase tracking-wide font-sans-semibold"
                  style={{ color: order.paymentStatus === "PAID" ? colors.success : colors.warning }}
                >
                  {order.paymentStatus}
                </Text>
              </View>
            </View>
          </MotiView>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function TotalRow({ label, amount, emphasized }: { label: string; amount: number; emphasized?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text variant={emphasized ? "label" : "muted"} className={emphasized ? "text-base" : "text-sm"}>
        {label}
      </Text>
      <Text variant={emphasized ? "price" : "body"} className={emphasized ? "text-lg" : "text-sm"}>
        ₹{amount}
      </Text>
    </View>
  )
}
