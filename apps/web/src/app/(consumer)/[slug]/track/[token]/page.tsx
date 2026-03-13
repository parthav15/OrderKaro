"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import { CheckCircle, Clock, ChefHat, Bell, ShoppingBag } from "lucide-react"
import api from "@/lib/api"
import { formatPrice } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

const STATUS_STEPS = [
  { key: "PLACED", label: "Order Placed", icon: ShoppingBag },
  { key: "ACCEPTED", label: "Accepted", icon: CheckCircle },
  { key: "PREPARING", label: "Preparing", icon: ChefHat },
  { key: "READY", label: "Ready", icon: Bell },
  { key: "PICKED_UP", label: "Picked Up", icon: CheckCircle },
]

function getStepIndex(status: string) {
  return STATUS_STEPS.findIndex((s) => s.key === status)
}

interface TrackingData {
  order: {
    id: string
    orderNumber: number
    status: string
    totalAmount: string
    placedAt: string
    specialInstructions: string | null
    canteen: { name: string }
    table: { label: string } | null
    items: Array<{
      id: string
      quantity: number
      unitPrice: string
      menuItem: { name: string }
      selectedOptions: Array<{ optionName: string }>
    }>
  }
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
      const status = query.state.data?.order?.status
      if (status === "PICKED_UP" || status === "CANCELLED") return false
      return 5000
    },
  })

  const order = data?.order
  const currentStepIndex = order ? getStepIndex(order.status) : -1
  const isReady = order?.status === "READY"
  const isPickedUp = order?.status === "PICKED_UP"

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <ShoppingBag className="w-14 h-14 text-neutral-200 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-brand-black mb-2">Order not found</h2>
          <p className="text-sm text-neutral-400">
            This tracking link may be invalid or expired.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-10">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-neutral-100 px-5 py-5"
      >
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
          {order.canteen.name}
          {order.table ? ` · ${order.table.label}` : ""}
        </p>
        <h1 className="text-2xl font-extrabold text-brand-black mt-1">
          Order #{order.orderNumber}
        </h1>
        <p className="text-sm text-neutral-400 mt-0.5">
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
              className="bg-brand-black rounded-2xl p-5 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                className="inline-flex"
              >
                <Bell className="w-10 h-10 text-white mx-auto" />
              </motion.div>
              <h2 className="text-lg font-extrabold text-white mt-3">
                Your order is ready!
              </h2>
              <p className="text-sm text-neutral-400 mt-1">
                Pick up at the counter now
              </p>
            </motion.div>
          )}

          {isPickedUp && (
            <motion.div
              key="pickedup-banner"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-brand-black rounded-2xl p-5 text-center"
            >
              <CheckCircle className="w-10 h-10 text-white mx-auto" />
              <h2 className="text-lg font-extrabold text-white mt-3">
                Enjoy your meal!
              </h2>
              <p className="text-sm text-neutral-400 mt-1">Order picked up</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-neutral-100 p-5"
        >
          <h2 className="text-sm font-bold text-brand-black mb-5">Order Status</h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-neutral-100" />
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
                          ? "bg-brand-black"
                          : "bg-neutral-100"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${isCompleted ? "text-white" : "text-neutral-400"}`}
                      />
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-semibold ${
                          isCompleted ? "text-brand-black" : "text-neutral-400"
                        }`}
                      >
                        {step.label}
                      </p>
                      {isCurrent && !isPickedUp && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "40%" }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-0.5 bg-brand-red rounded-full mt-1"
                        />
                      )}
                    </div>
                    {isCurrent && !isPickedUp && (
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
          className="rounded-2xl border border-neutral-100 p-5"
        >
          <h2 className="text-sm font-bold text-brand-black mb-4">Items Ordered</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brand-black">
                    {item.quantity}x {item.menuItem.name}
                  </p>
                  {item.selectedOptions.length > 0 && (
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {item.selectedOptions.map((o) => o.optionName).join(", ")}
                    </p>
                  )}
                </div>
                <span className="text-sm font-semibold text-brand-black flex-shrink-0">
                  {formatPrice(Number(item.unitPrice) * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {order.specialInstructions && (
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider mb-1">
                Special Instructions
              </p>
              <p className="text-sm text-neutral-600">{order.specialInstructions}</p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-neutral-100 flex justify-between items-center">
            <span className="text-sm font-bold text-brand-black">Total</span>
            <span className="text-lg font-extrabold text-brand-black">
              {formatPrice(order.totalAmount)}
            </span>
          </div>
        </motion.div>

        {!isPickedUp && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-xs text-neutral-400"
          >
            Page auto-refreshes every 5 seconds
          </motion.p>
        )}
      </div>
    </div>
  )
}
