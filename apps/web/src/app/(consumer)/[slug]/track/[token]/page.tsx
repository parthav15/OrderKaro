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
  whatsappOptIn?: { number: string; message: string } | null
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

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.463 3.488"/>
    </svg>
  )
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

        {order.whatsappOptIn && !isPickedUp && order.status !== "CANCELLED" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, type: "spring", stiffness: 260, damping: 22 }}
            className="relative overflow-hidden rounded-2xl border border-[#25D366]/30 bg-gradient-to-br from-[#25D366]/[0.12] to-[#128C7E]/[0.05] p-5"
          >
            <motion.span
              aria-hidden
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.15, 0.4] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#25D366]/40 blur-2xl"
            />
            <motion.span
              aria-hidden
              initial={{ x: "-140%" }}
              animate={{ x: "260%" }}
              transition={{ repeat: Infinity, duration: 3.6, ease: "easeInOut", repeatDelay: 1.4 }}
              className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/4 -skew-x-12 bg-white/15"
            />
            <div className="relative flex items-center gap-4">
              <motion.span
                animate={{ rotate: [0, -7, 7, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#25D366] shadow-lg shadow-[#25D366]/40"
              >
                <WhatsAppGlyph className="h-6 w-6 text-white" />
              </motion.span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-ink">You&apos;ll get updates on WhatsApp</p>
                <p className="mt-0.5 text-xs text-muted">
                  We&apos;ll message you here as your order moves.
                </p>
              </div>
            </div>
          </motion.div>
        )}

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
