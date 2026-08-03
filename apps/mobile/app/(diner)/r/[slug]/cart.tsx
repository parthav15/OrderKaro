import { useEffect, useState } from "react"
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { SafeAreaView } from "react-native-safe-area-context"
import { MotiView, AnimatePresence } from "moti"
import * as Location from "expo-location"
import * as Haptics from "expo-haptics"
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Utensils,
  Bike,
  Banknote,
  Smartphone,
  AlertTriangle,
  MapPin,
  CheckCircle2,
} from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { PaymentSheet } from "@/components/payment-sheet"
import { api, ApiError } from "@/lib/api"
import { getIdentity, signOut } from "@/lib/auth"
import { useCart } from "@/stores/cart"
import { useTheme } from "@/theme/theme-provider"
import type { MenuResponse, PaymentSession } from "@/lib/types"
import { formatPrice } from "@/lib/format"

type Fulfillment = "TAKEAWAY" | "DINE_IN" | "DELIVERY"
type Payment = "CASH" | "ONLINE"

type DeliveryCheck = {
  deliverable: boolean
  distanceKm: number | null
  radiusKm: number
}

function idempotencyKey() {
  return `vm-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

type FeePart = { enabled: boolean; mode: string; amount: number }

function feePart(part: FeePart | undefined, base: number): number {
  if (!part || !part.enabled) return 0
  return part.mode === "PERCENT" ? (base * part.amount) / 100 : part.amount
}

function computeHandlingFee(
  isDelivery: boolean,
  fees: { delivery: FeePart; convenience: FeePart } | null | undefined,
  legacyDeliveryFee: number,
  subtotalAmount: number
): number {
  if (!isDelivery) return 0
  if (fees) {
    const raw = feePart(fees.delivery, subtotalAmount) + feePart(fees.convenience, subtotalAmount)
    return Math.round(raw * 100) / 100
  }
  return legacyDeliveryFee
}

export default function CartScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()
  const { colors } = useTheme()

  const { restaurantId, tableId: storeTableId, lines, changeQuantity, lineTotal, subtotal, clear } =
    useCart()
  const fixedTable = !!storeTableId

  const [fulfillment, setFulfillment] = useState<Fulfillment>(
    storeTableId ? "DINE_IN" : "TAKEAWAY"
  )
  const [payment, setPayment] = useState<Payment>("ONLINE")
  const [tableId, setTableId] = useState<string | null>(storeTableId)
  const [deliveryLocation, setDeliveryLocation] = useState("")
  const [instructions, setInstructions] = useState("")
  const [placing, setPlacing] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationMessage, setLocationMessage] = useState<string | null>(null)
  const [deliveryCheck, setDeliveryCheck] = useState<DeliveryCheck | null>(null)
  const [checkingRange, setCheckingRange] = useState(false)
  const [feeExempt, setFeeExempt] = useState(false)
  const [dinerPhone, setDinerPhone] = useState<string | null>(null)
  const [session, setSession] = useState<(PaymentSession & { orderId: string; token?: string }) | null>(
    null
  )

  const { data: menu } = useQuery({
    queryKey: ["menu", slug],
    queryFn: () => api.get<MenuResponse>(`/api/v1/public/restaurant/${slug}/menu`),
    enabled: !!slug,
  })

  const restaurant = menu?.restaurant
  const currency = restaurant?.currency ?? "INR"
  const onlineAvailable = Boolean(restaurant?.acceptsOnline && restaurant?.onlinePaymentEnabled)
  const cashAvailable = Boolean(restaurant?.acceptsCash)
  const availablePayments: Payment[] = []
  if (onlineAvailable) availablePayments.push("ONLINE")
  if (cashAvailable) availablePayments.push("CASH")

  const acceptsDineIn = restaurant?.acceptsDineIn !== false
  const acceptsTakeaway = restaurant?.acceptsTakeaway !== false
  const acceptsDelivery = restaurant?.acceptsDelivery !== false
  const fulfillmentAvailable: Record<Fulfillment, boolean> = {
    TAKEAWAY: acceptsTakeaway,
    DINE_IN: acceptsDineIn,
    DELIVERY: acceptsDelivery,
  }

  const deliveryZoneActive = Boolean(restaurant?.deliveryEnabled && restaurant?.hasLocation)
  const outOfRange =
    fulfillment === "DELIVERY" &&
    deliveryZoneActive &&
    Boolean(coords) &&
    deliveryCheck != null &&
    !deliveryCheck.deliverable
  const deliveryRestrictedItems =
    fulfillment === "DELIVERY" ? lines.filter((l) => l.availableForDelivery === false) : []
  const hasDeliveryRestrictedItems = deliveryRestrictedItems.length > 0

  const itemsTotal = subtotal()
  const handlingFee = computeHandlingFee(
    fulfillment === "DELIVERY",
    restaurant?.fees,
    deliveryZoneActive ? Number(restaurant?.deliveryFee ?? 0) : 0,
    itemsTotal
  )
  const effectiveHandlingFee = feeExempt ? 0 : handlingFee
  const total = itemsTotal + effectiveHandlingFee

  const tableLabel = menu?.tables.find((t) => t.id === storeTableId)?.label

  const placeDisabled =
    (fulfillment === "DINE_IN" && !tableId) ||
    (fulfillment === "DELIVERY" && !deliveryLocation.trim()) ||
    (fulfillment === "DELIVERY" && hasDeliveryRestrictedItems) ||
    availablePayments.length === 0

  useEffect(() => {
    if (storeTableId) {
      setFulfillment("DINE_IN")
      setTableId(storeTableId)
    }
  }, [storeTableId])

  useEffect(() => {
    getIdentity().then((identity) => setDinerPhone(identity?.phone ?? null))
  }, [])

  useEffect(() => {
    if (!menu) return
    setPayment((current) => (availablePayments.includes(current) ? current : availablePayments[0] ?? current))
  }, [menu, onlineAvailable, cashAvailable])

  useEffect(() => {
    if (!menu || storeTableId) return
    const order: Fulfillment[] = ["TAKEAWAY", "DINE_IN", "DELIVERY"]
    setFulfillment((current) =>
      fulfillmentAvailable[current] ? current : order.find((k) => fulfillmentAvailable[k]) ?? current
    )
  }, [menu, acceptsDineIn, acceptsTakeaway, acceptsDelivery, storeTableId])

  useEffect(() => {
    setOrderError(null)
  }, [fulfillment])

  const ALL_FULFILL: { key: Fulfillment; label: string; Icon: typeof Utensils }[] = [
    { key: "TAKEAWAY", label: "Takeaway", Icon: ShoppingBag },
    { key: "DINE_IN", label: "Dine-in", Icon: Utensils },
    { key: "DELIVERY", label: "Delivery", Icon: Bike },
  ]
  const FULFILL = ALL_FULFILL.filter((f) => fulfillmentAvailable[f.key])

  async function checkDeliveryRange(latitude: number, longitude: number) {
    if (!deliveryZoneActive) {
      setDeliveryCheck(null)
      setFeeExempt(false)
      return
    }
    setCheckingRange(true)
    try {
      const result = await api.post<{
        enforced: boolean
        deliverable: boolean
        distanceKm: number | null
        radiusKm: number
        feeExempt: boolean
      }>(`/api/v1/public/restaurant/${slug}/delivery-check`, {
        latitude,
        longitude,
        phone: dinerPhone ?? undefined,
      })
      setDeliveryCheck({
        deliverable: Boolean(result.deliverable),
        distanceKm: result.distanceKm ?? null,
        radiusKm: Number(result.radiusKm ?? 0),
      })
      setFeeExempt(Boolean(result.feeExempt))
    } catch {
      setDeliveryCheck(null)
      setFeeExempt(false)
    } finally {
      setCheckingRange(false)
    }
  }

  async function requestLocation() {
    setLocationMessage(null)
    setDeliveryCheck(null)
    setFeeExempt(false)
    setLocating(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== Location.PermissionStatus.GRANTED) {
        setLocationMessage("Location access denied. Enable it in Settings or enter your address below.")
        return
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      void checkDeliveryRange(position.coords.latitude, position.coords.longitude)
    } catch {
      setLocationMessage("Couldn't get your location right now. Enter your address below instead.")
    } finally {
      setLocating(false)
    }
  }

  async function placeOrder() {
    if (!restaurantId) return
    setOrderError(null)

    if (fulfillment === "DINE_IN" && !tableId) {
      setOrderError("Please select your table")
      return
    }
    if (fulfillment === "DELIVERY" && hasDeliveryRestrictedItems) {
      setOrderError("Remove pickup-only items or switch fulfillment to place this order")
      return
    }
    if (fulfillment === "DELIVERY" && !deliveryLocation.trim()) {
      setOrderError("Please enter a delivery location")
      return
    }
    if (fulfillment === "DELIVERY" && deliveryZoneActive && !coords) {
      setOrderError("Please share your location so we can check the delivery range")
      return
    }
    if (fulfillment === "DELIVERY" && outOfRange) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      setOrderError(
        `You're outside the delivery area — ${deliveryCheck?.distanceKm} km away, delivers within ${deliveryCheck?.radiusKm} km. Try pickup or a closer address.`
      )
      return
    }
    if (availablePayments.length === 0) {
      setOrderError("No payment method is available for this restaurant right now")
      return
    }

    setPlacing(true)
    try {
      const body = {
        orderType: fulfillment,
        tableId: fulfillment === "DINE_IN" ? tableId : undefined,
        deliveryLocation: fulfillment === "DELIVERY" ? deliveryLocation.trim() : undefined,
        deliveryLatitude: fulfillment === "DELIVERY" ? coords?.latitude : undefined,
        deliveryLongitude: fulfillment === "DELIVERY" ? coords?.longitude : undefined,
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
        return
      }
      clear()
      router.replace({
        pathname: "/(diner)/r/[slug]/track/[token]",
        params: { slug, token: order.trackingToken },
      })
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setOrderError("Please sign in again to place your order")
        await signOut()
        router.replace("/(diner)")
      } else {
        setOrderError(e instanceof Error ? e.message : "Failed to place order")
      }
    } finally {
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

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View className="gap-3 mb-6">
          {lines.map((l) => {
            const restricted = fulfillment === "DELIVERY" && l.availableForDelivery === false
            return (
              <View
                key={l.key}
                className={`flex-row items-center bg-surface rounded-2xl border p-4 ${
                  restricted ? "border-danger/40 bg-danger/5" : "border-line"
                }`}
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
                    {formatPrice(lineTotal(l), currency)}
                  </Text>
                  <AnimatePresence>
                    {restricted ? (
                      <MotiView
                        key="restricted"
                        from={{ opacity: 0, translateY: -4 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        exit={{ opacity: 0, translateY: -4 }}
                        transition={{ type: "timing", duration: 200 }}
                        className="flex-row items-center gap-1.5 mt-1.5"
                      >
                        <AlertTriangle size={12} color={colors.danger} />
                        <Text className="text-danger text-xs font-sans-semibold">
                          Pickup only — not for delivery
                        </Text>
                      </MotiView>
                    ) : null}
                  </AnimatePresence>
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
            )
          })}
        </View>

        <Text variant="label" className="text-sm mb-3">
          Fulfillment
        </Text>
        {fixedTable ? (
          <View className="flex-row items-center gap-3 bg-primary/10 border border-primary rounded-2xl px-5 py-4 mb-3">
            <Utensils size={20} color={colors.primary} />
            <Text variant="label" className="text-base">
              Dine-in{tableLabel ? ` · ${tableLabel}` : ""}
            </Text>
          </View>
        ) : (
          <>
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
              <View className="mb-3">
                <Pressable
                  onPress={requestLocation}
                  disabled={locating || checkingRange}
                  className={`flex-row items-center justify-center gap-2 h-14 rounded-2xl border mb-2 ${
                    outOfRange
                      ? "border-danger bg-danger/10"
                      : coords
                        ? "border-success bg-success/10"
                        : "border-line bg-surface"
                  }`}
                >
                  {locating ? (
                    <MotiView
                      key="locating"
                      from={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ type: "timing", duration: 150 }}
                      className="flex-row items-center gap-2"
                    >
                      <ActivityIndicator size="small" color={colors.muted} />
                      <Text variant="muted" className="text-sm font-sans-semibold">
                        Getting your location…
                      </Text>
                    </MotiView>
                  ) : checkingRange ? (
                    <MotiView
                      key="checking"
                      from={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ type: "timing", duration: 150 }}
                      className="flex-row items-center gap-2"
                    >
                      <ActivityIndicator size="small" color={colors.muted} />
                      <Text variant="muted" className="text-sm font-sans-semibold">
                        Checking delivery range…
                      </Text>
                    </MotiView>
                  ) : outOfRange ? (
                    <MotiView
                      key="outofrange"
                      from={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", damping: 16, stiffness: 260 }}
                      className="flex-row items-center gap-2"
                    >
                      <AlertTriangle size={16} color={colors.danger} />
                      <Text className="text-danger text-sm font-sans-semibold">
                        Outside delivery area — tap to retry
                      </Text>
                    </MotiView>
                  ) : coords ? (
                    <MotiView
                      key="captured"
                      from={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", damping: 16, stiffness: 260 }}
                      className="flex-row items-center gap-2"
                    >
                      <CheckCircle2 size={16} color={colors.success} />
                      <Text className="text-success text-sm font-sans-semibold">
                        {deliveryCheck?.distanceKm != null
                          ? `Within delivery area · ${deliveryCheck.distanceKm} km — tap to update`
                          : "Location captured — tap to update"}
                      </Text>
                    </MotiView>
                  ) : (
                    <MotiView
                      key="idle"
                      from={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ type: "timing", duration: 150 }}
                      className="flex-row items-center gap-2"
                    >
                      <MapPin size={16} color={colors.ink} />
                      <Text variant="label" className="text-sm">
                        Use my current location
                      </Text>
                    </MotiView>
                  )}
                </Pressable>

                <AnimatePresence>
                  {locationMessage ? (
                    <MotiView
                      key="location-message"
                      from={{ opacity: 0, translateY: -6 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      exit={{ opacity: 0, translateY: -6 }}
                      transition={{ type: "timing", duration: 220 }}
                      className="flex-row items-start gap-2 bg-danger/10 border border-danger/30 rounded-xl px-3 py-2.5 mb-2"
                    >
                      <AlertTriangle size={13} color={colors.danger} style={{ marginTop: 1 }} />
                      <Text className="text-danger text-xs flex-1">{locationMessage}</Text>
                    </MotiView>
                  ) : null}
                </AnimatePresence>

                <AnimatePresence>
                  {outOfRange && deliveryCheck ? (
                    <MotiView
                      key="range-message"
                      from={{ opacity: 0, translateY: -6 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      exit={{ opacity: 0, translateY: -6 }}
                      transition={{ type: "timing", duration: 220 }}
                      className="flex-row items-start gap-2 bg-danger/10 border border-danger/30 rounded-xl px-3 py-2.5 mb-2"
                    >
                      <AlertTriangle size={13} color={colors.danger} style={{ marginTop: 1 }} />
                      <Text className="text-danger text-xs flex-1">
                        You're {deliveryCheck.distanceKm} km away — {restaurant?.name ?? "This restaurant"}{" "}
                        delivers within {deliveryCheck.radiusKm} km. Try pickup or a closer address.
                      </Text>
                    </MotiView>
                  ) : null}
                </AnimatePresence>

                <TextInput
                  value={deliveryLocation}
                  onChangeText={setDeliveryLocation}
                  placeholder="Delivery address / room"
                  placeholderTextColor={colors.muted}
                  className="h-14 rounded-2xl bg-surface border border-line px-5 text-ink font-sans-medium text-base mb-2"
                />

                {deliveryZoneActive ? (
                  <Text variant="muted" className="text-xs">
                    {restaurant?.name ?? "This restaurant"} delivers within {restaurant?.deliveryRadiusKm} km
                    {effectiveHandlingFee > 0
                      ? ` · delivery & handling ${formatPrice(effectiveHandlingFee, currency)}`
                      : " · free delivery"}
                    {Number(restaurant?.minOrderValue ?? 0) > 0
                      ? ` · min order ${formatPrice(Number(restaurant?.minOrderValue), currency)}`
                      : ""}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </>
        )}

        <TextInput
          value={instructions}
          onChangeText={setInstructions}
          placeholder="Special instructions (optional)"
          placeholderTextColor={colors.muted}
          className="h-14 rounded-2xl bg-surface border border-line px-5 text-ink font-sans-medium text-base mb-6 mt-3"
        />

        <Text variant="label" className="text-sm mb-3">
          Payment
        </Text>
        <View className="gap-2">
          {availablePayments.includes("ONLINE") ? (
            <PaymentOption
              active={payment === "ONLINE"}
              onPress={() => setPayment("ONLINE")}
              Icon={Smartphone}
              label="Pay online (UPI / card)"
            />
          ) : null}
          {availablePayments.includes("CASH") ? (
            <PaymentOption
              active={payment === "CASH"}
              onPress={() => setPayment("CASH")}
              Icon={Banknote}
              label="Cash"
            />
          ) : null}
          {availablePayments.length === 0 ? (
            <Text variant="muted" className="text-sm">
              No payment method is available right now. Please contact the restaurant.
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <View className="px-5 pb-10 pt-3 border-t border-line bg-canvas">
        <AnimatePresence>
          {hasDeliveryRestrictedItems ? (
            <MotiView
              key="delivery-restricted-banner"
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: 10 }}
              transition={{ type: "timing", duration: 220 }}
              className="flex-row items-start gap-2 bg-danger/10 border border-danger/30 rounded-xl p-3 mb-3"
            >
              <AlertTriangle size={15} color={colors.danger} style={{ marginTop: 1 }} />
              <Text className="text-danger text-xs font-sans-semibold flex-1">
                {deliveryRestrictedItems.length === 1
                  ? "1 item is pickup-only — remove it or switch fulfillment to place this order."
                  : `${deliveryRestrictedItems.length} items are pickup-only — remove them or switch fulfillment to place this order.`}
              </Text>
            </MotiView>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {orderError ? (
            <MotiView
              key="order-error-banner"
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: 10 }}
              transition={{ type: "timing", duration: 220 }}
              className="flex-row items-start gap-2 bg-danger/10 border border-danger/30 rounded-xl p-3 mb-3"
            >
              <AlertTriangle size={15} color={colors.danger} style={{ marginTop: 1 }} />
              <Text className="text-danger text-xs font-sans-semibold flex-1">{orderError}</Text>
            </MotiView>
          ) : null}
        </AnimatePresence>

        {handlingFee > 0 ? (
          <>
            <View className="flex-row items-center justify-between mb-1.5">
              <Text variant="muted" className="text-xs">
                Items
              </Text>
              <Text variant="muted" className="text-xs font-sans-semibold">
                {formatPrice(itemsTotal, currency)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between mb-2">
              <Text variant="muted" className="text-xs">
                Delivery & handling
              </Text>
              {feeExempt ? (
                <View className="flex-row items-center gap-1.5">
                  <Text
                    variant="muted"
                    className="text-xs"
                    style={{ textDecorationLine: "line-through", opacity: 0.6 }}
                  >
                    {formatPrice(handlingFee, currency)}
                  </Text>
                  <Text className="text-success text-xs font-sans-semibold">
                    {formatPrice(0, currency)}
                  </Text>
                </View>
              ) : (
                <Text variant="muted" className="text-xs font-sans-semibold">
                  {formatPrice(handlingFee, currency)}
                </Text>
              )}
            </View>
          </>
        ) : null}

        <AnimatePresence>
          {feeExempt && handlingFee > 0 ? (
            <MotiView
              key="fee-waived"
              from={{ opacity: 0, translateY: 6, scale: 0.96 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              exit={{ opacity: 0, translateY: 6 }}
              transition={{ type: "spring", damping: 18, stiffness: 220 }}
              className="flex-row items-center gap-1.5 self-start bg-success/10 border border-success/30 rounded-full px-3 py-1.5 mb-3"
            >
              <CheckCircle2 size={13} color={colors.success} />
              <Text className="text-success text-xs font-sans-semibold">
                Delivery fee waived
              </Text>
            </MotiView>
          ) : null}
        </AnimatePresence>

        <View className="flex-row items-center justify-between mb-3">
          <Text variant="muted" className="text-base">
            Total
          </Text>
          <Text variant="heading" className="text-2xl">
            {formatPrice(total, currency)}
          </Text>
        </View>
        <Button
          title="Place order"
          loading={placing}
          disabled={placeDisabled}
          onPress={placeOrder}
        />
      </View>
      </KeyboardAvoidingView>

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
