import { useState } from "react"
import { View, ScrollView, Pressable, TextInput } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { SafeAreaView } from "react-native-safe-area-context"
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Utensils,
  Bike,
  Banknote,
  Wallet as WalletIcon,
  Smartphone,
} from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { PaymentSheet } from "@/components/payment-sheet"
import { api } from "@/lib/api"
import { useCart } from "@/stores/cart"
import { useTheme } from "@/theme/theme-provider"
import type { MenuResponse, PaymentSession } from "@/lib/types"

type Fulfillment = "TAKEAWAY" | "DINE_IN" | "DELIVERY"
type Payment = "CASH" | "WALLET" | "ONLINE"

function idempotencyKey() {
  return `vm-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export default function CartScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()
  const { colors } = useTheme()

  const { restaurantId, tableId: storeTableId, lines, changeQuantity, lineTotal, subtotal, clear } =
    useCart()
  const [fulfillment, setFulfillment] = useState<Fulfillment>(
    storeTableId ? "DINE_IN" : "TAKEAWAY"
  )
  const [payment, setPayment] = useState<Payment>("CASH")
  const [tableId, setTableId] = useState<string | null>(storeTableId)
  const [deliveryLocation, setDeliveryLocation] = useState("")
  const [instructions, setInstructions] = useState("")
  const [placing, setPlacing] = useState(false)
  const [session, setSession] = useState<(PaymentSession & { orderId: string; token?: string }) | null>(
    null
  )

  const { data: menu } = useQuery({
    queryKey: ["menu", slug],
    queryFn: () => api.get<MenuResponse>(`/api/v1/public/restaurant/${slug}/menu`),
    enabled: !!slug,
  })

  const { data: wallet } = useQuery({
    queryKey: ["wallet", slug],
    queryFn: () => api.get<{ balance: string }>(`/api/v1/consumer/wallet?slug=${slug}`, true),
    enabled: !!slug,
  })

  const onlineEnabled = menu?.restaurant.onlinePaymentEnabled
  const walletBalance = Number(wallet?.balance ?? 0)
  const total = subtotal()
  const walletShort = payment === "WALLET" && walletBalance < total

  const FULFILL: { key: Fulfillment; label: string; Icon: typeof Utensils }[] = [
    { key: "TAKEAWAY", label: "Takeaway", Icon: ShoppingBag },
    { key: "DINE_IN", label: "Dine-in", Icon: Utensils },
    { key: "DELIVERY", label: "Delivery", Icon: Bike },
  ]

  async function placeOrder() {
    if (!restaurantId) return
    if (fulfillment === "DINE_IN" && !tableId) return
    if (fulfillment === "DELIVERY" && !deliveryLocation.trim()) return
    setPlacing(true)
    try {
      const body = {
        orderType: fulfillment,
        tableId: fulfillment === "DINE_IN" ? tableId : undefined,
        deliveryLocation: fulfillment === "DELIVERY" ? deliveryLocation.trim() : undefined,
        items: lines.map((l) => ({
          menuItemId: l.menuItemId,
          quantity: l.quantity,
          selectedOptions: l.selectedOptions.map((o) => ({
            customizationId: o.customizationId,
            optionIds: o.optionIds,
          })),
          notes: l.notes,
        })),
        specialInstructions: instructions || undefined,
        paymentMethod: payment,
        idempotencyKey: idempotencyKey(),
      }
      const order = await api.post<any>(`/api/v1/restaurants/${restaurantId}/orders`, body, true)

      if (order.payment) {
        setSession({ ...order.payment, orderId: order.id, token: order.trackingToken })
        setPlacing(false)
        return
      }
      clear()
      router.replace({
        pathname: "/(diner)/r/[slug]/track/[token]",
        params: { slug, token: order.trackingToken },
      })
    } catch {
      setPlacing(false)
    }
  }

  if (lines.length === 0 && !session) {
    return (
      <SafeAreaView className="flex-1 bg-canvas items-center justify-center px-8">
        <ShoppingBag size={44} color={colors.muted} />
        <Text variant="title" className="text-xl mt-4 mb-1">
          Your cart is empty
        </Text>
        <Text variant="muted" className="text-base mb-6 text-center">
          Add a few dishes to get started.
        </Text>
        <Button title="Back to menu" variant="outline" onPress={() => router.back()} />
      </SafeAreaView>
    )
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
          Your cart
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View className="gap-3 mb-6">
          {lines.map((l) => (
            <View
              key={l.key}
              className="flex-row items-center bg-surface rounded-2xl border border-line p-4"
            >
              <View className="flex-1 pr-3">
                <Text variant="title" className="text-base">
                  {l.name}
                </Text>
                {l.selectedOptions.length > 0 ? (
                  <Text variant="muted" className="text-xs mt-0.5">
                    {l.selectedOptions.flatMap((o) => o.optionNames).join(", ")}
                  </Text>
                ) : null}
                <Text variant="price" className="text-base mt-1">
                  ₹{lineTotal(l)}
                </Text>
              </View>
              <View className="flex-row items-center bg-canvas rounded-full border border-line">
                <Pressable
                  onPress={() => changeQuantity(l.key, -1)}
                  className="w-9 h-9 items-center justify-center"
                >
                  <Minus size={16} color={colors.ink} />
                </Pressable>
                <Text variant="label" className="text-sm w-5 text-center">
                  {l.quantity}
                </Text>
                <Pressable
                  onPress={() => changeQuantity(l.key, 1)}
                  className="w-9 h-9 items-center justify-center"
                >
                  <Plus size={16} color={colors.ink} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <Text variant="label" className="text-sm mb-3">
          Fulfillment
        </Text>
        <View className="flex-row gap-2 mb-3">
          {FULFILL.map((f) => {
            const active = fulfillment === f.key
            return (
              <Pressable
                key={f.key}
                onPress={() => setFulfillment(f.key)}
                className={`flex-1 items-center py-3 rounded-2xl border ${
                  active ? "border-primary bg-primary/10" : "border-line bg-surface"
                }`}
              >
                <f.Icon size={20} color={active ? colors.primary : colors.muted} />
                <Text variant={active ? "label" : "muted"} className="text-xs mt-1">
                  {f.label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {fulfillment === "DINE_IN" && menu?.tables ? (
          <View className="flex-row flex-wrap gap-2 mb-3">
            {menu.tables.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => setTableId(t.id)}
                className={`px-4 py-2 rounded-full border ${
                  tableId === t.id ? "border-primary bg-primary/10" : "border-line bg-surface"
                }`}
              >
                <Text variant={tableId === t.id ? "label" : "muted"} className="text-sm">
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {fulfillment === "DELIVERY" ? (
          <TextInput
            value={deliveryLocation}
            onChangeText={setDeliveryLocation}
            placeholder="Delivery address / room"
            placeholderTextColor={colors.muted}
            className="h-14 rounded-2xl bg-surface border border-line px-5 text-ink font-sans-medium text-base mb-3"
          />
        ) : null}

        <TextInput
          value={instructions}
          onChangeText={setInstructions}
          placeholder="Special instructions (optional)"
          placeholderTextColor={colors.muted}
          className="h-14 rounded-2xl bg-surface border border-line px-5 text-ink font-sans-medium text-base mb-6"
        />

        <Text variant="label" className="text-sm mb-3">
          Payment
        </Text>
        <View className="gap-2">
          <PaymentOption
            active={payment === "CASH"}
            onPress={() => setPayment("CASH")}
            Icon={Banknote}
            label="Cash"
          />
          <PaymentOption
            active={payment === "WALLET"}
            onPress={() => setPayment("WALLET")}
            Icon={WalletIcon}
            label={`Wallet · ₹${walletBalance}`}
          />
          {onlineEnabled ? (
            <PaymentOption
              active={payment === "ONLINE"}
              onPress={() => setPayment("ONLINE")}
              Icon={Smartphone}
              label="Pay online (UPI / card)"
            />
          ) : null}
        </View>
        {walletShort ? (
          <Text className="text-danger font-sans-medium text-sm mt-3">
            Wallet is short by ₹{total - walletBalance}. Top up from the wallet tab or pick another
            method.
          </Text>
        ) : null}
      </ScrollView>

      <View className="px-5 pb-10 pt-3 border-t border-line bg-canvas">
        <View className="flex-row items-center justify-between mb-3">
          <Text variant="muted" className="text-base">
            Total
          </Text>
          <Text variant="heading" className="text-2xl">
            ₹{total}
          </Text>
        </View>
        <Button
          title="Place order"
          loading={placing}
          disabled={
            walletShort ||
            (fulfillment === "DINE_IN" && !tableId) ||
            (fulfillment === "DELIVERY" && !deliveryLocation.trim())
          }
          onPress={placeOrder}
        />
      </View>

      <PaymentSheet
        session={session}
        title={fulfillment === "DELIVERY" ? "Pay for delivery" : "Pay for your order"}
        onSuccess={(data) => {
          const token = (data.trackingToken as string) || session?.token
          clear()
          setSession(null)
          if (token)
            router.replace({
              pathname: "/(diner)/r/[slug]/track/[token]",
              params: { slug, token },
            })
        }}
        onClose={() => setSession(null)}
      />
    </SafeAreaView>
  )
}

function PaymentOption({
  active,
  onPress,
  Icon,
  label,
}: {
  active: boolean
  onPress: () => void
  Icon: typeof Banknote
  label: string
}) {
  const { colors } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 px-4 py-4 rounded-2xl border ${
        active ? "border-primary bg-primary/10" : "border-line bg-surface"
      }`}
    >
      <Icon size={20} color={active ? colors.primary : colors.muted} />
      <Text variant={active ? "label" : "body"} className="text-base">
        {label}
      </Text>
    </Pressable>
  )
}
