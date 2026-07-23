"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import { CheckCircle, Clock, ChefHat, Bell, ShoppingBag } from "lucide-react"
import api from "@/lib/api"
import { formatPrice, orderDestinationLabel } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

const STATUS_STEPS = [
  { key: "PLACED", label: "Order Placed", icon: ShoppingBag },
  { key: "ACCEPTED", label: "Accepted", icon: CheckCircle },
  { key: "PREPARING", label: "Preparing", icon: ChefHat },
  { key: "READY", label: "Ready", icon: Bell },
]

function getStepIndex(status: string) {
  if (status === "PICKED_UP") return STATUS_STEPS.length - 1
  return STATUS_STEPS.findIndex((s) => s.key === status)
}

interface TrackingData {
  orderNumber: number
  status: string
  totalAmount: string
  placedAt: string
  specialInstructions: string | null
  orderType?: string
  deliveryLocation?: string | null
  restaurant: { name: string }
  table: { label: string } | null
  items: Array<{
    id?: string
    quantity: number
    unitPrice: string
    name?: string
    menuItem?: { name: string }
    selectedOptions?: Array<{ optionName?: string }>
  }>
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function TrackOrderPage({
  params,
}: {
  params: { slug: string; token: string }
}) {
  const { data, isLoading, error } = useQuery<TrackingData>({
    queryKey: ["track-order", params.token],
    queryFn: () =>
      api.get(`/api/v1/public/track/${params.token}`).then((r) => r.data.data),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === "READY" || status === "PICKED_UP" || status === "CANCELLED") return false
      return 5000
    },
  })

  const order = data
  const currentStepIndex = order ? getStepIndex(order.status) : -1
  const isReady = order?.status === "READY"
  const isPickedUp = order?.status === "PICKED_UP"
  const isDone = isReady || isPickedUp

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <ShoppingBag className="w-14 h-14 text-muted mx-auto mb-4" />
          <h2 className="text-lg font-bold text-ink mb-2">Order not found</h2>
          <p className="text-sm text-muted">
            This tracking link may be invalid or expired.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas pb-10">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface border-b border-line px-5 py-5"
      >
        <p className="text-xs font-semibold text-muted uppercase tracking-wider">
          {order.restaurant.name} · {orderDestinationLabel(order)}
        </p>
        <h1 className="text-2xl font-extrabold text-ink mt-1">
          Order #{order.orderNumber}
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Placed at {formatTime(order.placedAt)}
        </p>
      </motion.div>

      <div className="px-5 py-6 space-y-6">
        <AnimatePresence mode="wait">
          {isReady && (
            <motion.div
              key="ready-banner"
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="bg-ink rounded-2xl p-5 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                className="inline-flex"
              >
                <Bell className="w-10 h-10 text-canvas mx-auto" />
              </motion.div>
              <h2 className="text-lg font-extrabold text-canvas mt-3">
                Your order is ready!
              </h2>
              <p className="text-sm text-canvas/60 mt-1">
                Pick up at the counter now
              </p>
            </motion.div>
          )}

          {isPickedUp && (
            <motion.div
              key="pickedup-banner"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-ink rounded-2xl p-5 text-center"
            >
              <CheckCircle className="w-10 h-10 text-canvas mx-auto" />
              <h2 className="text-lg font-extrabold text-canvas mt-3">
                Enjoy your meal!
              </h2>
              <p className="text-sm text-canvas/60 mt-1">Order picked up</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-line p-5"
        >
          <h2 className="text-sm font-bold text-ink mb-5">Order Status</h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-line" />
            <div className="space-y-5">
              {STATUS_STEPS.map((step, idx) => {
                const isCompleted = idx <= currentStepIndex
                const isCurrent = idx === currentStepIndex
                const Icon = step.icon
                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    className="flex items-center gap-4 relative"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-colors ${
                        isCompleted
                          ? "bg-ink"
                          : "bg-surface-elevated"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${isCompleted ? "text-canvas" : "text-muted"}`}
                      />
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-semibold ${
                          isCompleted ? "text-ink" : "text-muted"
                        }`}
                      >
                        {step.label}
                      </p>
                      {isCurrent && !isDone && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "40%" }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-0.5 bg-brand-red rounded-full mt-1"
                        />
                      )}
                    </div>
                    {isCurrent && !isDone && (
                      <motion.div
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ repeat: Infinity, duration: 1.4 }}
                      >
                        <Clock className="w-4 h-4 text-brand-red" />
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-line p-5"
        >
          <h2 className="text-sm font-bold text-ink mb-4">Items Ordered</h2>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={item.id ?? idx} className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {item.quantity}x {item.menuItem?.name ?? item.name}
                  </p>
                  {(item.selectedOptions ?? []).some((o) => o.optionName) && (
                    <p className="text-xs text-muted mt-0.5">
                      {(item.selectedOptions ?? [])
                        .map((o) => o.optionName)
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                </div>
                <span className="text-sm font-semibold text-ink flex-shrink-0">
                  {formatPrice(Number(item.unitPrice) * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {order.specialInstructions && (
            <div className="mt-4 pt-4 border-t border-line">
              <p className="text-xs text-muted font-medium uppercase tracking-wider mb-1">
                Special Instructions
              </p>
              <p className="text-sm text-muted">{order.specialInstructions}</p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-line flex justify-between items-center">
            <span className="text-sm font-bold text-ink">Total</span>
            <span className="text-lg font-extrabold text-ink">
              {formatPrice(order.totalAmount)}
            </span>
          </div>
        </motion.div>

        {!isDone && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-xs text-muted"
          >
            Page auto-refreshes every 5 seconds
          </motion.p>
        )}
      </div>
    </div>
  )
}
