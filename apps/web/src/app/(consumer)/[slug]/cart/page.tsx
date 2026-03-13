"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { ArrowLeft, Minus, Plus, Trash2, Wallet, Banknote, ShoppingCart } from "lucide-react"
import { useCartStore } from "@/stores/cart"
import { useAuthStore } from "@/stores/auth"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import api from "@/lib/api"
import { toast } from "sonner"
import { requestNotificationPermission, getNotificationPermission, isNotificationSupported } from "@/lib/pwa"
import { generateUUID } from "@/lib/utils"

export default function CartPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const { items, removeItem, updateQuantity, clearCart, getTotal, canteenId, tableId } = useCartStore()
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "WALLET">("CASH")
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [loading, setLoading] = useState(false)

  const total = getTotal()

  async function handlePlaceOrder() {
    if (!canteenId || !tableId) {
      toast.error("Please scan a QR code first")
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post(`/api/v1/canteens/${canteenId}/orders`, {
        tableId,
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

      clearCart()
      localStorage.setItem("orderkaro-has-placed-order", "true")

      if (isNotificationSupported() && getNotificationPermission() === "default") {
        requestNotificationPermission()
      }

      toast.success("Order placed! Track your order")

      const trackingToken = data.data.trackingToken
      if (trackingToken) {
        router.push(`/${params.slug}/track/${trackingToken}`)
      } else {
        router.push(`/${params.slug}/order/${data.data.id}`)
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        const raw = localStorage.getItem("orderkaro-consumer")
        if (raw) {
          try {
            const stored = JSON.parse(raw)
            const { data: identifyData } = await api.post("/api/v1/public/identify", {
              name: stored.name,
              phone: stored.phone,
            })
            const result = identifyData.data
            useAuthStore.getState().setAuth(
              { id: result.consumer.id, name: result.consumer.name, phone: result.consumer.phone, role: "CONSUMER" },
              result.accessToken,
              ""
            )
            localStorage.setItem(
              "orderkaro-consumer",
              JSON.stringify({ ...stored, accessToken: result.accessToken })
            )
            toast.error("Session refreshed. Please try again.")
            setLoading(false)
            return
          } catch {}
        }
        toast.error("Session expired. Please go back and re-enter your details.")
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
    <div className="min-h-screen bg-white pb-32">
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
        </div>
      </div>

      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 inset-x-0 p-4 bg-white border-t border-neutral-100"
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-neutral-500">Total</span>
          <span className="text-xl font-extrabold text-brand-black">{formatPrice(total)}</span>
        </div>
        <Button className="w-full" size="lg" loading={loading} onClick={handlePlaceOrder}>
          Place Order
        </Button>
      </motion.div>
    </div>
  )
}
