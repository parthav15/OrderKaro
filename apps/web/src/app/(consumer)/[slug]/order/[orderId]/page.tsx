"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Clock, CheckCircle2, ChefHat, Bell, Package, WifiOff } from "lucide-react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { connectSocket } from "@/lib/socket"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice, formatTime, getTimeSince } from "@/lib/utils"
import { toast } from "sonner"
import {
  requestNotificationPermission,
  showOrderReadyNotification,
  isNotificationSupported,
  getNotificationPermission,
} from "@/lib/pwa"

const STATUS_STEPS = [
  { key: "PLACED", label: "Order Placed", icon: CheckCircle2 },
  { key: "ACCEPTED", label: "Accepted", icon: CheckCircle2 },
  { key: "PREPARING", label: "Preparing", icon: ChefHat },
  { key: "READY", label: "Ready for Pickup", icon: Bell },
  { key: "PICKED_UP", label: "Picked Up", icon: Package },
]

const CACHE_KEY_PREFIX = "orderkaro-order-cache-"

function buildCacheKey(orderId: string) {
  return `${CACHE_KEY_PREFIX}${orderId}`
}

function saveOrderToCache(orderId: string, order: any) {
  try {
    localStorage.setItem(
      buildCacheKey(orderId),
      JSON.stringify({ order, cachedAt: Date.now() })
    )
  } catch {}
}

function loadOrderFromCache(orderId: string): { order: any; cachedAt: number } | null {
  try {
    const raw = localStorage.getItem(buildCacheKey(orderId))
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export default function OrderTrackingPage({
  params,
}: {
  params: { slug: string; orderId: string }
}) {
  const router = useRouter()
  const [liveStatus, setLiveStatus] = useState<string | null>(null)
  const [resolvedCanteenId, setResolvedCanteenId] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)
  const [cachedOrder, setCachedOrder] = useState<any>(null)
  const [cachedAt, setCachedAt] = useState<number | null>(null)
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default")

  useEffect(() => {
    if (isNotificationSupported()) {
      setNotifPermission(getNotificationPermission())
    }
  }, [])

  useEffect(() => {
    const stored = loadOrderFromCache(params.orderId)
    if (stored) {
      setCachedOrder(stored.order)
      setCachedAt(stored.cachedAt)
    }
  }, [params.orderId])

  useEffect(() => {
    function onOnline() {
      setIsOffline(false)
    }
    function onOffline() {
      setIsOffline(true)
    }

    setIsOffline(!navigator.onLine)
    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)
    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
    }
  }, [])

  useEffect(() => {
    api
      .get(`/api/v1/public/canteen/${params.slug}/menu`)
      .then((r) => setResolvedCanteenId(r.data.data.canteen.id))
      .catch(() => {})
  }, [params.slug])

  const { data: order, refetch } = useQuery({
    queryKey: ["order", params.orderId],
    queryFn: () =>
      api
        .get(`/api/v1/canteens/${resolvedCanteenId}/orders/${params.orderId}`)
        .then((r) => r.data.data),
    enabled: !!resolvedCanteenId && !isOffline,
    refetchInterval: isOffline ? false : 10000,
  })

  useEffect(() => {
    if (order) {
      saveOrderToCache(params.orderId, order)
      setCachedOrder(order)
      setCachedAt(Date.now())
    }
  }, [order, params.orderId])

  const handleNotificationRequest = useCallback(async () => {
    const permission = await requestNotificationPermission()
    setNotifPermission(permission)
    if (permission === "granted") {
      toast.success("Notifications enabled for order updates")
    } else if (permission === "denied") {
      toast.error("Notification permission denied")
    }
  }, [])

  useEffect(() => {
    const socket = connectSocket()
    socket.emit("order:subscribe", params.orderId)

    socket.on("order:status", (data: { orderId: string; status: string }) => {
      if (data.orderId === params.orderId) {
        setLiveStatus(data.status)
        refetch()

        if (data.status === "READY" && notifPermission === "granted") {
          const displayOrder = order || cachedOrder
          if (displayOrder) {
            showOrderReadyNotification(displayOrder.orderNumber, params.orderId, params.slug)
          }
        }
      }
    })

    socket.on("order:ready", (data: { orderId: string; orderNumber: number }) => {
      if (data.orderId === params.orderId) {
        toast.success(`Order #${data.orderNumber} is ready for pickup!`)
        if (notifPermission === "granted") {
          showOrderReadyNotification(data.orderNumber, params.orderId, params.slug)
        }
      }
    })

    return () => {
      socket.emit("order:unsubscribe", params.orderId)
      socket.off("order:status")
      socket.off("order:ready")
    }
  }, [params.orderId, params.slug, refetch, notifPermission, order, cachedOrder])

  const displayOrder = order || cachedOrder
  const currentStatus = liveStatus || displayOrder?.status || "PLACED"
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === currentStatus)
  const isCancelled = currentStatus === "CANCELLED"

  async function handleCancel() {
    if (!resolvedCanteenId) return
    try {
      await api.post(`/api/v1/canteens/${resolvedCanteenId}/orders/${params.orderId}/cancel`)
      toast.success("Order cancelled")
      refetch()
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Cannot cancel order")
    }
  }

  if (!resolvedCanteenId && !displayOrder) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!displayOrder) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-30 bg-white border-b border-neutral-100 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.push(`/${params.slug}/menu`)} className="p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Order #{displayOrder.orderNumber}</h1>
        {isNotificationSupported() && notifPermission === "default" && (
          <button
            onClick={handleNotificationRequest}
            className="ml-auto p-1.5 rounded-xl bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors"
            title="Enable order notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="px-4 pt-3"
          >
            <div className="flex items-center gap-2 bg-neutral-100 rounded-xl px-3 py-2.5">
              <WifiOff className="w-4 h-4 text-neutral-500 shrink-0" />
              <p className="text-xs text-neutral-600 font-medium">
                Offline — last updated{" "}
                {cachedAt ? getTimeSince(new Date(cachedAt)) : "recently"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNotificationSupported() && notifPermission === "default" && !isOffline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pt-3"
          >
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleNotificationRequest}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-neutral-300 hover:border-brand-red hover:bg-red-50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 group-hover:bg-brand-red transition-colors">
                <Bell className="w-4 h-4 text-brand-red group-hover:text-white transition-colors" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-brand-black">Get notified when ready</p>
                <p className="text-xs text-neutral-500">Tap to enable order notifications</p>
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 py-6">
        {isCancelled ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-neutral-400" />
            </div>
            <h2 className="text-xl font-bold text-brand-black">Order Cancelled</h2>
            <p className="text-sm text-neutral-500 mt-1">
              {displayOrder.paymentMethod === "WALLET" && "Refund has been credited to your wallet"}
            </p>
          </motion.div>
        ) : (
          <>
            {currentStatus === "READY" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-brand-black rounded-xl p-4 mb-6 text-center"
              >
                <p className="text-white font-bold text-lg">Your order is ready!</p>
                <p className="text-neutral-400 text-sm">Please pick up at the counter</p>
                <p className="text-white text-3xl font-extrabold mt-2">#{displayOrder.orderNumber}</p>
              </motion.div>
            )}

            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-4 h-4 text-neutral-400" />
              <span className="text-sm text-neutral-500">
                Placed {getTimeSince(displayOrder.placedAt)}
              </span>
              {displayOrder.estimatedReadyAt && currentStepIndex < 3 && (
                <span className="text-sm text-brand-red font-medium ml-auto">
                  Ready by {formatTime(displayOrder.estimatedReadyAt)}
                </span>
              )}
            </div>

            <div className="space-y-0 mb-8">
              {STATUS_STEPS.map((step, idx) => {
                const isCompleted = idx <= currentStepIndex
                const isActive = idx === currentStepIndex
                const Icon = step.icon

                return (
                  <div key={step.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <motion.div
                        initial={isActive ? { scale: 0.8 } : {}}
                        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                        transition={isActive ? { repeat: Infinity, duration: 2 } : {}}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? "bg-brand-red text-white"
                            : "bg-neutral-100 text-neutral-400"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </motion.div>
                      {idx < STATUS_STEPS.length - 1 && (
                        <div className={`w-0.5 h-8 ${
                          idx < currentStepIndex ? "bg-brand-red" : "bg-neutral-200"
                        }`} />
                      )}
                    </div>
                    <div className="pb-6">
                      <p className={`text-sm font-semibold ${
                        isCompleted ? "text-brand-black" : "text-neutral-400"
                      }`}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        <div className="border-t border-neutral-100 pt-4">
          <h3 className="font-bold text-sm mb-3">Order Details</h3>
          <div className="space-y-2">
            {displayOrder.items.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.quantity}x {item.menuItem.name}
                </span>
                <span className="font-medium">{formatPrice(item.totalPrice)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-neutral-100">
              <span>Total</span>
              <span>{formatPrice(displayOrder.totalAmount)}</span>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <Badge>{displayOrder.paymentMethod}</Badge>
            <Badge variant={displayOrder.paymentStatus === "PAID" ? "success" : "warning"}>
              {displayOrder.paymentStatus}
            </Badge>
          </div>
        </div>

        {(currentStatus === "PLACED" || currentStatus === "ACCEPTED") && !isCancelled && !isOffline && (
          <div className="mt-6">
            <Button variant="danger" className="w-full" onClick={handleCancel}>
              Cancel Order
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
