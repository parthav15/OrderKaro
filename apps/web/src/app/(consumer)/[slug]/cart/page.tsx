"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  Wallet,
  Banknote,
  ShoppingCart,
  ShoppingBag,
  Utensils,
  Bike,
  MapPin,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { useCartStore } from "@/stores/cart"
import { useAuthStore } from "@/stores/auth"
import { Button } from "@/components/ui/button"
import { cn, formatPrice, generateUUID } from "@/lib/utils"
import api from "@/lib/api"
import { toast } from "sonner"
import { requestNotificationPermission, getNotificationPermission, isNotificationSupported } from "@/lib/pwa"
import { useWalletRecharge } from "@/hooks/use-wallet-recharge"
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe"
import { StorefrontTheme } from "@/components/consumer/storefront-theme"
import { PaymentModal } from "@/components/consumer/payment-modal"

type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY"
type PaymentMethod = "CASH" | "WALLET" | "ONLINE"

interface StorefrontConfig {
  name?: string
  primaryColor?: string
  deliveryEnabled?: boolean
  deliveryRadiusKm?: number
  deliveryFee?: string
  minOrderValue?: string
  hasLocation?: boolean
  onlinePaymentEnabled?: boolean
  acceptsWallet?: boolean
  acceptsCash?: boolean
  acceptsOnline?: boolean
}

const FULFILLMENT_OPTIONS: Array<{ value: OrderType; label: string; icon: typeof Utensils }> = [
  { value: "TAKEAWAY", label: "Takeaway", icon: ShoppingBag },
  { value: "DINE_IN", label: "Dine-in", icon: Utensils },
  { value: "DELIVERY", label: "Delivery", icon: Bike },
]

const PAYMENT_METHOD_META: Record<PaymentMethod, { label: string; icon: typeof Wallet }> = {
  WALLET: { label: "Wallet", icon: Wallet },
  CASH: { label: "Cash", icon: Banknote },
  ONLINE: { label: "Pay online", icon: Smartphone },
}

export default function CartPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const { items, removeItem, updateQuantity, clearCart, getTotal, restaurantId, tableId } = useCartStore()
  const user = useAuthStore((s) => s.user)
  const reducedMotion = useReducedMotionSafe()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("WALLET")
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [loading, setLoading] = useState(false)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const { recharging, recharge } = useWalletRecharge()
  const [paymentSession, setPaymentSession] = useState<any>(null)

  const [orderType, setOrderType] = useState<OrderType>("TAKEAWAY")
  const [pickedTableId, setPickedTableId] = useState("")
  const [deliveryLocation, setDeliveryLocation] = useState("")
  const [tables, setTables] = useState<Array<{ id: string; label: string }>>([])
  const [storefront, setStorefront] = useState<StorefrontConfig | null>(null)
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationMessage, setLocationMessage] = useState<string | null>(null)

  const fixedTable = !!tableId
  const tableLabel = tables.find((t) => t.id === tableId)?.label

  const acceptsWallet = storefront?.acceptsWallet !== false
  const acceptsCash = storefront?.acceptsCash !== false
  const acceptsOnline = storefront?.acceptsOnline !== false
  const onlinePaymentAvailable = acceptsOnline && Boolean(storefront?.onlinePaymentEnabled)
  const deliveryZoneActive = Boolean(storefront?.deliveryEnabled && storefront?.hasLocation)
  const deliveryFeeAmount =
    deliveryZoneActive && orderType === "DELIVERY" ? Number(storefront?.deliveryFee ?? 0) : 0

  const availablePaymentMethods: PaymentMethod[] = []
  if (acceptsWallet) availablePaymentMethods.push("WALLET")
  if (acceptsCash) availablePaymentMethods.push("CASH")
  if (onlinePaymentAvailable) availablePaymentMethods.push("ONLINE")

  const deliveryRestrictedItems =
    orderType === "DELIVERY" ? items.filter((item) => item.availableForDelivery === false) : []
  const hasDeliveryRestrictedItems = deliveryRestrictedItems.length > 0

  const itemsTotal = getTotal()
  const total = itemsTotal + deliveryFeeAmount
  const shortfall = Math.max(0, Math.ceil(total - (walletBalance ?? 0)))
  const walletInsufficient =
    paymentMethod === "WALLET" && walletBalance !== null && walletBalance < total

  async function loadBalance() {
    try {
      const { data } = await api.get(`/api/v1/consumer/wallet?slug=${params.slug}`)
      setWalletBalance(Number(data.data.balance))
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status
      if (status === 401) {
        router.replace(`/${params.slug}/menu`)
      }
    }
  }

  useEffect(() => {
    loadBalance()
    api
      .get(`/api/v1/public/restaurant/${params.slug}/menu`)
      .then((r) => {
        setTables(r.data.data.tables ?? [])
        setStorefront(r.data.data.restaurant ?? null)
      })
      .catch(() => {})

    if (typeof window !== "undefined") {
      const topup = new URLSearchParams(window.location.search).get("topup")
      if (topup === "paid") {
        toast.success("Wallet topped up")
        setPaymentMethod("WALLET")
      } else if (topup === "failed" || topup === "invalid") {
        toast.error("Top-up did not complete")
      } else if (topup === "pending") {
        toast("Top-up is still processing")
      }
      if (topup) window.history.replaceState({}, "", window.location.pathname)
    }
  }, [params.slug])

  useEffect(() => {
    if (!storefront) return
    setPaymentMethod((current) =>
      availablePaymentMethods.includes(current) ? current : availablePaymentMethods[0] ?? current
    )
  }, [storefront, acceptsWallet, acceptsCash, onlinePaymentAvailable])

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("Location isn't available on this device. Enter your address below instead.")
      return
    }
    setLocationMessage(null)
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setLocating(false)
        setLocationMessage(null)
        toast.success("Location captured")
      },
      (geoError) => {
        setLocating(false)
        setLocationMessage(
          geoError.code === geoError.PERMISSION_DENIED
            ? "Location access denied. Allow it in your browser settings or enter your address below."
            : "Couldn't get your location right now. Enter your address below instead."
        )
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function handleTopUp() {
    if (shortfall <= 0 || !restaurantId) return
    const session = await recharge(restaurantId, shortfall)
    if (session) {
      setPaymentSession({ ...session, kind: "topup" })
    }
  }

  async function handlePlaceOrder() {
    if (!restaurantId) {
      toast.error("Please scan a QR code first")
      return
    }

    const finalOrderType: OrderType = fixedTable ? "DINE_IN" : orderType
    const finalTableId =
      finalOrderType === "DINE_IN" ? (fixedTable ? tableId : pickedTableId) : undefined
    const finalDeliveryLocation =
      finalOrderType === "DELIVERY" ? deliveryLocation.trim() : undefined

    if (finalOrderType === "DINE_IN" && !finalTableId) {
      toast.error("Please select your table")
      return
    }
    if (finalOrderType === "DELIVERY" && hasDeliveryRestrictedItems) {
      toast.error("Remove pickup-only items or switch fulfillment to place this order")
      return
    }
    if (finalOrderType === "DELIVERY" && !finalDeliveryLocation) {
      toast.error("Please enter a delivery location")
      return
    }
    if (finalOrderType === "DELIVERY" && deliveryZoneActive && !coords) {
      toast.error("Please share your location so we can check the delivery range")
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post(`/api/v1/restaurants/${restaurantId}/orders`, {
        orderType: finalOrderType,
        tableId: finalTableId,
        deliveryLocation: finalDeliveryLocation,
        deliveryLatitude: finalOrderType === "DELIVERY" ? coords?.latitude : undefined,
        deliveryLongitude: finalOrderType === "DELIVERY" ? coords?.longitude : undefined,
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions.map((o) => ({
            customizationId: o.customizationId,
            optionIds: o.optionIds,
          })),
          notes: item.notes,
        })),
        specialInstructions: specialInstructions || undefined,
        paymentMethod,
        idempotencyKey: generateUUID(),
      })

      localStorage.setItem("orderkaro-has-placed-order", "true")

      if (isNotificationSupported() && getNotificationPermission() === "default") {
        requestNotificationPermission()
      }

      const payment = data.data.payment
      if (payment) {
        setPaymentSession({
          ...payment,
          kind: "order",
          orderId: data.data.id,
          fallbackTrackingToken: data.data.trackingToken,
        })
        return
      }

      clearCart()
      toast.success("Order placed! Track your order")

      const trackingToken = data.data.trackingToken
      if (trackingToken) {
        router.push(`/${params.slug}/track/${trackingToken}`)
      } else {
        router.push(`/${params.slug}/order/${data.data.id}`)
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        toast.error("Please sign in again to place your order")
        router.replace(`/${params.slug}/menu`)
      } else {
        toast.error(err.response?.data?.error || "Failed to place order")
      }
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
            className="w-20 h-20 rounded-full bg-surface-elevated flex items-center justify-center mx-auto mb-4"
          >
            <ShoppingCart className="w-10 h-10 text-muted" />
          </motion.div>
          <h2 className="text-xl font-bold text-ink mb-2">Your cart is empty</h2>
          <p className="text-muted mb-6">Add some items to get started</p>
          <Button onClick={() => router.push(`/${params.slug}/menu`)} variant="outline">
            Browse Menu
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <StorefrontTheme
      primaryColor={storefront?.primaryColor}
      className="min-h-screen bg-canvas pb-32"
    >
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-30 bg-surface border-b border-line px-4 py-4 flex items-center gap-3"
      >
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()} className="p-1">
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <h1 className="text-lg font-bold">Your Cart</h1>
      </motion.div>

      <div className="px-4 py-4 space-y-3">
        {items.map((item, index) => {
          const isDeliveryRestricted = orderType === "DELIVERY" && item.availableForDelivery === false
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex gap-3 p-3 rounded-xl border transition-colors",
                isDeliveryRestricted ? "border-danger/40 bg-danger/5" : "border-line"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 border-2 rounded-sm flex items-center justify-center ${
                    item.isVeg ? "border-ink" : "border-brand-red"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      item.isVeg ? "bg-ink" : "bg-brand-red"
                    }`} />
                  </span>
                  <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                </div>
                {item.selectedOptions.length > 0 && (
                  <p className="text-xs text-muted mt-1">
                    {item.selectedOptions.map((o) => o.optionNames.join(", ")).join(" · ")}
                  </p>
                )}
                <p className="font-bold text-sm mt-1">
                  {formatPrice(
                    (item.price + item.selectedOptions.reduce((s, o) => s + o.priceAdjustment, 0)) * item.quantity
                  )}
                </p>
                <AnimatePresence initial={false}>
                  {isDeliveryRestricted && (
                    <motion.p
                      key="delivery-restricted"
                      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -4 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -4 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-danger mt-1.5 overflow-hidden"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Pickup only — not available for delivery
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex flex-col items-end gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => removeItem(index)}
                  className="text-muted hover:text-brand-red transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
                <div className="flex items-center border border-line rounded-lg">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => item.quantity > 1 ? updateQuantity(index, item.quantity - 1) : removeItem(index)}
                    className="px-2 py-1"
                  >
                    <Minus className="w-3 h-3" />
                  </motion.button>
                  <span className="px-2 text-sm font-semibold">{item.quantity}</span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => updateQuantity(index, item.quantity + 1)}
                    className="px-2 py-1"
                  >
                    <Plus className="w-3 h-3" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="px-4 space-y-3"
      >
        <h3 className="font-semibold text-sm">Fulfillment</h3>
        {fixedTable ? (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-line text-sm font-medium">
            <Utensils className="w-5 h-5 text-brand-red" />
            Dine-in{tableLabel ? ` · ${tableLabel}` : ""}
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              {FULFILLMENT_OPTIONS.map((m) => {
                const active = orderType === m.value
                return (
                  <motion.button
                    key={m.value}
                    layout
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setOrderType(m.value)}
                    className={cn(
                      "relative flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-semibold overflow-hidden transition-colors",
                      active ? "border-brand-red text-brand-red" : "border-line text-ink"
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="fulfillment-active"
                        className="absolute inset-0 bg-primary/10"
                        transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <m.icon className="relative w-5 h-5" />
                    <span className="relative">{m.label}</span>
                  </motion.button>
                )
              })}
            </div>
            {orderType === "DINE_IN" && (
              <select
                value={pickedTableId}
                onChange={(e) => setPickedTableId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-line text-sm bg-surface focus:outline-none focus:border-brand-red"
              >
                <option value="">Select your table</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            )}
            {orderType === "DELIVERY" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <motion.button
                    type="button"
                    layout
                    whileTap={{ scale: 0.97 }}
                    onClick={handleUseMyLocation}
                    disabled={locating}
                    className={cn(
                      "relative w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold overflow-hidden transition-colors disabled:opacity-70",
                      coords
                        ? "border-success text-success bg-success/5"
                        : "border-line text-ink hover:border-brand-red"
                    )}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {locating ? (
                        <motion.span
                          key="locating"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="flex items-center gap-2"
                        >
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Getting your location…
                        </motion.span>
                      ) : coords ? (
                        <motion.span
                          key="captured"
                          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ type: "spring", stiffness: 420, damping: 22 }}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Location captured — tap to update
                        </motion.span>
                      ) : (
                        <motion.span
                          key="idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="flex items-center gap-2"
                        >
                          <MapPin className="w-4 h-4" />
                          Use my current location
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                  <AnimatePresence initial={false}>
                    {locationMessage && (
                      <motion.p
                        key="location-message"
                        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6, height: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="flex items-start gap-2 text-xs text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2 overflow-hidden"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{locationMessage}</span>
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <input
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  placeholder="Where should we deliver? (room / desk / hostel)"
                  maxLength={200}
                  className="w-full px-4 py-3 rounded-xl border border-line text-sm bg-surface focus:outline-none focus:border-brand-red"
                />

                {deliveryZoneActive && (
                  <p className="text-xs text-muted">
                    {storefront?.name ?? "This restaurant"} delivers within{" "}
                    {storefront?.deliveryRadiusKm} km
                    {Number(storefront?.deliveryFee ?? 0) > 0
                      ? ` · delivery fee ${formatPrice(Number(storefront?.deliveryFee))}`
                      : " · free delivery"}
                    {Number(storefront?.minOrderValue ?? 0) > 0
                      ? ` · min order ${formatPrice(Number(storefront?.minOrderValue))}`
                      : ""}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </motion.div>

      <div className="px-4 py-4">
        <textarea
          placeholder="Special instructions (optional)"
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-line text-sm bg-surface resize-none focus:outline-none focus:border-brand-red"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="px-4 space-y-3"
      >
        <h3 className="font-semibold text-sm">Payment Method</h3>
        <div className="flex gap-3">
          <AnimatePresence initial={false} mode="popLayout">
            {availablePaymentMethods.map((method) => {
              const meta = PAYMENT_METHOD_META[method]
              const Icon = meta.icon
              const active = paymentMethod === method
              return (
                <motion.button
                  key={method}
                  layout
                  initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.94 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setPaymentMethod(method)}
                  className={cn(
                    "relative flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium overflow-hidden transition-colors",
                    active ? "border-brand-red text-brand-red" : "border-line text-ink"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="payment-method-active"
                      className="absolute inset-0 bg-primary/10"
                      transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <Icon className="relative w-5 h-5" />
                  <span className="relative">{meta.label}</span>
                </motion.button>
              )
            })}
          </AnimatePresence>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          {paymentMethod === "ONLINE" && (
            <motion.p
              key="online-note"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="text-xs text-muted px-1"
            >
              You will be taken to a secure payment page. Your order reaches the kitchen once the
              payment is confirmed.
            </motion.p>
          )}
          {paymentMethod === "WALLET" && (
            <motion.div
              key="wallet-note"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-between text-sm px-1"
            >
              <span className="text-muted">
                Wallet balance:{" "}
                <span className="font-semibold text-ink">
                  {walletBalance === null ? "…" : formatPrice(walletBalance)}
                </span>
              </span>
              {walletInsufficient && (
                <span className="text-brand-red font-medium">Short by {formatPrice(shortfall)}</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="fixed bottom-0 inset-x-0 p-4 bg-surface border-t border-line"
      >
        <AnimatePresence initial={false}>
          {hasDeliveryRestrictedItems && (
            <motion.div
              key="delivery-block-notice"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-start gap-2 bg-danger/10 border border-danger/30 rounded-xl p-3 mb-3 overflow-hidden"
            >
              <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-danger">
                {deliveryRestrictedItems.length === 1
                  ? "1 item is pickup-only — remove it or switch fulfillment to place this order."
                  : `${deliveryRestrictedItems.length} items are pickup-only — remove them or switch fulfillment to place this order.`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        {deliveryFeeAmount > 0 && (
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-muted">Items</span>
            <span className="text-xs font-semibold text-muted">
              {formatPrice(itemsTotal)}
            </span>
          </div>
        )}
        {deliveryFeeAmount > 0 && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted">Delivery fee</span>
            <span className="text-xs font-semibold text-muted">
              {formatPrice(deliveryFeeAmount)}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-muted">Total</span>
          <span className="text-xl font-extrabold text-ink">{formatPrice(total)}</span>
        </div>
        {hasDeliveryRestrictedItems ? (
          <Button className="w-full" size="lg" disabled>
            Place Order
          </Button>
        ) : walletInsufficient ? (
          <Button className="w-full" size="lg" loading={recharging} onClick={handleTopUp}>
            <Wallet className="w-4 h-4" />
            Add {formatPrice(shortfall)} to wallet
          </Button>
        ) : (
          <Button className="w-full" size="lg" loading={loading} onClick={handlePlaceOrder}>
            Place Order
          </Button>
        )}
      </motion.div>

      <PaymentModal
        open={!!paymentSession}
        session={paymentSession}
        title={paymentSession?.kind === "topup" ? "Add money" : "Pay for your order"}
        onSuccess={(data) => {
          if (paymentSession?.kind === "topup") {
            if (typeof data?.balance !== "undefined") {
              setWalletBalance(Number(data.balance))
            }
            toast.success("Wallet topped up")
            setPaymentMethod("WALLET")
            setPaymentSession(null)
            return
          }

          const trackingToken = data?.trackingToken ?? paymentSession?.fallbackTrackingToken
          const orderId = paymentSession?.orderId
          clearCart()
          toast.success("Payment successful! Track your order")
          setPaymentSession(null)
          if (trackingToken) {
            router.push(`/${params.slug}/track/${trackingToken}`)
          } else if (orderId) {
            router.push(`/${params.slug}/order/${orderId}`)
          }
        }}
        onClose={() => setPaymentSession(null)}
      />
    </StorefrontTheme>
  )
}
