"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
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
} from "lucide-react"
import { useCartStore } from "@/stores/cart"
import { useAuthStore } from "@/stores/auth"
import { Button } from "@/components/ui/button"
import { formatPrice, generateUUID } from "@/lib/utils"
import api from "@/lib/api"
import { toast } from "sonner"
import { requestNotificationPermission, getNotificationPermission, isNotificationSupported } from "@/lib/pwa"
import { useWalletRecharge } from "@/hooks/use-wallet-recharge"
import { StorefrontTheme } from "@/components/consumer/storefront-theme"
import { PaymentModal } from "@/components/consumer/payment-modal"

type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY"

interface StorefrontConfig {
  name?: string
  primaryColor?: string
  deliveryEnabled?: boolean
  deliveryRadiusKm?: number
  deliveryFee?: string
  minOrderValue?: string
  hasLocation?: boolean
  onlinePaymentEnabled?: boolean
}

const FULFILLMENT_OPTIONS: Array<{ value: OrderType; label: string; icon: typeof Utensils }> = [
  { value: "TAKEAWAY", label: "Takeaway", icon: ShoppingBag },
  { value: "DINE_IN", label: "Dine-in", icon: Utensils },
  { value: "DELIVERY", label: "Delivery", icon: Bike },
]

export default function CartPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const { items, removeItem, updateQuantity, clearCart, getTotal, restaurantId, tableId } = useCartStore()
  const user = useAuthStore((s) => s.user)
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "WALLET" | "ONLINE">("CASH")
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

  const fixedTable = !!tableId
  const tableLabel = tables.find((t) => t.id === tableId)?.label

  const onlinePaymentAvailable = Boolean(storefront?.onlinePaymentEnabled)
  const deliveryZoneActive = Boolean(storefront?.deliveryEnabled && storefront?.hasLocation)
  const deliveryFeeAmount =
    deliveryZoneActive && orderType === "DELIVERY" ? Number(storefront?.deliveryFee ?? 0) : 0

  const itemsTotal = getTotal()
  const total = itemsTotal + deliveryFeeAmount
  const shortfall = Math.max(0, Math.ceil(total - (walletBalance ?? 0)))
  const walletInsufficient =
    paymentMethod === "WALLET" && walletBalance !== null && walletBalance < total

  async function reidentifyFromStorage(): Promise<boolean> {
    const raw = typeof window !== "undefined" ? localStorage.getItem("orderkaro-consumer") : null
    if (!raw) return false
    try {
      const stored = JSON.parse(raw)
      const { data } = await api.post("/api/v1/public/identify", {
        name: stored.name,
        phone: stored.phone,
        slug: params.slug,
      })
      const result = data.data
      useAuthStore.getState().setAuth(
        {
          id: result.consumer.id,
          name: result.consumer.name,
          phone: result.consumer.phone,
          role: "CONSUMER",
        },
        result.accessToken,
        ""
      )
      localStorage.setItem(
        "orderkaro-consumer",
        JSON.stringify({ ...stored, accessToken: result.accessToken })
      )
      return true
    } catch {
      return false
    }
  }

  async function loadBalance() {
    try {
      const { data } = await api.get(`/api/v1/consumer/wallet?slug=${params.slug}`)
      setWalletBalance(Number(data.data.balance))
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status
      if (status === 401 && (await reidentifyFromStorage())) {
        try {
          const { data } = await api.get(`/api/v1/consumer/wallet?slug=${params.slug}`)
          setWalletBalance(Number(data.data.balance))
        } catch {}
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

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      toast.error("Location is not available on this device")
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setLocating(false)
        toast.success("Location captured")
      },
      () => {
        setLocating(false)
        toast.error("Could not get your location. Please allow location access.")
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
      if (err.response?.status === 401 && (await reidentifyFromStorage())) {
        toast.error("Session refreshed. Please try again.")
      } else {
        toast.error(err.response?.data?.error || "Failed to place order")
      }
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-10 h-10 text-neutral-300" />
          </div>
          <h2 className="text-xl font-bold text-brand-black mb-2">Your cart is empty</h2>
          <p className="text-neutral-500 mb-6">Add some items to get started</p>
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
      className="min-h-screen bg-white pb-32"
    >
      <div className="sticky top-0 z-30 bg-white border-b border-neutral-100 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Your Cart</h1>
      </div>

      <div className="px-4 py-4 space-y-3">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex gap-3 p-3 rounded-xl border border-neutral-100"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 border-2 rounded-sm flex items-center justify-center ${
                  item.isVeg ? "border-brand-black" : "border-brand-red"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    item.isVeg ? "bg-brand-black" : "bg-brand-red"
                  }`} />
                </span>
                <h3 className="font-semibold text-sm truncate">{item.name}</h3>
              </div>
              {item.selectedOptions.length > 0 && (
                <p className="text-xs text-neutral-500 mt-1">
                  {item.selectedOptions.map((o) => o.optionNames.join(", ")).join(" · ")}
                </p>
              )}
              <p className="font-bold text-sm mt-1">
                {formatPrice(
                  (item.price + item.selectedOptions.reduce((s, o) => s + o.priceAdjustment, 0)) * item.quantity
                )}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button onClick={() => removeItem(index)} className="text-neutral-400 hover:text-brand-red">
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="flex items-center border border-neutral-200 rounded-lg">
                <button
                  onClick={() => item.quantity > 1 ? updateQuantity(index, item.quantity - 1) : removeItem(index)}
                  className="px-2 py-1"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="px-2 text-sm font-semibold">{item.quantity}</span>
                <button onClick={() => updateQuantity(index, item.quantity + 1)} className="px-2 py-1">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="px-4 space-y-3">
        <h3 className="font-semibold text-sm">Fulfillment</h3>
        {fixedTable ? (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-neutral-200 text-sm font-medium">
            <Utensils className="w-5 h-5 text-brand-red" />
            Dine-in{tableLabel ? ` · ${tableLabel}` : ""}
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              {FULFILLMENT_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setOrderType(m.value)}
                  className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-semibold transition-colors ${
                    orderType === m.value
                      ? "border-brand-red bg-red-50 text-brand-red"
                      : "border-neutral-200 text-brand-black"
                  }`}
                >
                  <m.icon className="w-5 h-5" />
                  {m.label}
                </button>
              ))}
            </div>
            {orderType === "DINE_IN" && (
              <select
                value={pickedTableId}
                onChange={(e) => setPickedTableId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm bg-white focus:outline-none focus:border-brand-red"
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
                <input
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  placeholder="Where should we deliver? (room / desk / hostel)"
                  maxLength={200}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-brand-red"
                />

                {deliveryZoneActive && (
                  <div className="space-y-2">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={handleUseMyLocation}
                      disabled={locating}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold transition-colors disabled:opacity-60 ${
                        coords
                          ? "border-brand-red text-brand-red"
                          : "border-neutral-200 text-brand-black hover:border-brand-red"
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      {locating
                        ? "Getting your location..."
                        : coords
                          ? "Location captured — tap to update"
                          : "Use my current location"}
                    </motion.button>
                    <p className="text-xs text-neutral-500">
                      {storefront?.name ?? "This restaurant"} delivers within{" "}
                      {storefront?.deliveryRadiusKm} km
                      {Number(storefront?.deliveryFee ?? 0) > 0
                        ? ` · delivery fee ${formatPrice(Number(storefront?.deliveryFee))}`
                        : " · free delivery"}
                      {Number(storefront?.minOrderValue ?? 0) > 0
                        ? ` · min order ${formatPrice(Number(storefront?.minOrderValue))}`
                        : ""}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="px-4 py-4">
        <textarea
          placeholder="Special instructions (optional)"
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm resize-none focus:outline-none focus:border-brand-red"
        />
      </div>

      <div className="px-4 space-y-3">
        <h3 className="font-semibold text-sm">Payment Method</h3>
        <div className="flex gap-3">
          <button
            onClick={() => setPaymentMethod("CASH")}
            className={`flex-1 flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-colors ${
              paymentMethod === "CASH" ? "border-brand-red bg-red-50 text-brand-red" : "border-neutral-200"
            }`}
          >
            <Banknote className="w-5 h-5" />
            Cash
          </button>
          <button
            onClick={() => setPaymentMethod("WALLET")}
            className={`flex-1 flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-colors ${
              paymentMethod === "WALLET" ? "border-brand-red bg-red-50 text-brand-red" : "border-neutral-200"
            }`}
          >
            <Wallet className="w-5 h-5" />
            Wallet
          </button>
          {onlinePaymentAvailable && (
            <button
              onClick={() => setPaymentMethod("ONLINE")}
              className={`flex-1 flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-colors ${
                paymentMethod === "ONLINE"
                  ? "border-brand-red bg-red-50 text-brand-red"
                  : "border-neutral-200"
              }`}
            >
              <Smartphone className="w-5 h-5" />
              Pay online
            </button>
          )}
        </div>
        {paymentMethod === "ONLINE" && (
          <p className="text-xs text-neutral-500 px-1">
            You will be taken to a secure payment page. Your order reaches the kitchen once the
            payment is confirmed.
          </p>
        )}
        {paymentMethod === "WALLET" && (
          <div className="flex items-center justify-between text-sm px-1">
            <span className="text-neutral-500">
              Wallet balance:{" "}
              <span className="font-semibold text-brand-black">
                {walletBalance === null ? "…" : formatPrice(walletBalance)}
              </span>
            </span>
            {walletInsufficient && (
              <span className="text-brand-red font-medium">Short by {formatPrice(shortfall)}</span>
            )}
          </div>
        )}
      </div>

      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 inset-x-0 p-4 bg-white border-t border-neutral-100"
      >
        {deliveryFeeAmount > 0 && (
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-neutral-500">Items</span>
            <span className="text-xs font-semibold text-neutral-600">
              {formatPrice(itemsTotal)}
            </span>
          </div>
        )}
        {deliveryFeeAmount > 0 && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-neutral-500">Delivery fee</span>
            <span className="text-xs font-semibold text-neutral-600">
              {formatPrice(deliveryFeeAmount)}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-neutral-500">Total</span>
          <span className="text-xl font-extrabold text-brand-black">{formatPrice(total)}</span>
        </div>
        {walletInsufficient ? (
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
