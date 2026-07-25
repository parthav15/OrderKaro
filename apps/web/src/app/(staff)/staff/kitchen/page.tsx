"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Clock,
  LogOut,
  UtensilsCrossed,
  TableProperties,
  AlertTriangle,
  CheckCircle2,
  Flame,
  PackageCheck,
  User,
  Phone,
} from "lucide-react"
import api from "@/lib/api"
import { connectSocket, realtimeEnabled } from "@/lib/socket"
import { useAuthStore } from "@/stores/auth"
import { getTimeSince, orderDestinationLabel } from "@/lib/utils"
import { STALE_ORDER_MINUTES } from "@orderkaro/shared"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/ui/theme-toggle"

function getUrgencyMinutes(placedAt: string) {
  return (Date.now() - new Date(placedAt).getTime()) / 60000
}

function UrgencyBadge({ placedAt }: { placedAt: string }) {
  const minutes = getUrgencyMinutes(placedAt)
  const isUrgent = minutes > STALE_ORDER_MINUTES.URGENT
  const isWarning = minutes > STALE_ORDER_MINUTES.WARNING

  if (isUrgent) {
    return (
      <motion.div
        animate={{ opacity: [1, 0.7, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        className="flex items-center gap-1.5 bg-primary/20 border border-primary px-3 py-1.5 rounded-xl"
      >
        <AlertTriangle className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-primary">VERY LATE — {Math.floor(minutes)}m</span>
      </motion.div>
    )
  }
  if (isWarning) {
    return (
      <div className="flex items-center gap-1.5 bg-line border border-muted/40 px-3 py-1.5 rounded-xl">
        <Clock className="w-4 h-4 text-ink" />
        <span className="text-sm font-bold text-ink">Waiting — {Math.floor(minutes)}m</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5 bg-surface-elevated px-3 py-1.5 rounded-xl">
      <Clock className="w-4 h-4 text-muted" />
      <span className="text-sm text-muted">{getTimeSince(placedAt)}</span>
    </div>
  )
}

function ColumnHeader({
  icon,
  label,
  count,
  accentClass,
}: {
  icon: React.ReactNode
  label: string
  count: number
  accentClass: string
}) {
  return (
    <div className={`flex items-center justify-between px-5 py-4 rounded-2xl mb-5 ${accentClass}`}>
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <span className="text-xl font-extrabold tracking-tight text-ink">{label}</span>
      </div>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={count}
          initial={{ opacity: 0, y: -6, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 26 }}
          className="text-4xl font-extrabold text-ink tabular-nums"
        >
          {count}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

function OrderCard({
  order,
  onAction,
  isPending,
}: {
  order: any
  onAction: () => void
  isPending: boolean
}) {
  const urgencyMinutes = getUrgencyMinutes(order.placedAt)
  const borderColor =
    urgencyMinutes > STALE_ORDER_MINUTES.URGENT
      ? "border-l-primary"
      : "border-l-line"

  const actionConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    PLACED: {
      label: "Accept Order",
      icon: <CheckCircle2 className="w-6 h-6" />,
      className: "bg-primary hover:bg-primary-hover text-white",
    },
    ACCEPTED: {
      label: "Start Cooking",
      icon: <Flame className="w-6 h-6" />,
      className: "bg-ink hover:opacity-90 text-canvas",
    },
    PREPARING: {
      label: "Mark Ready",
      icon: <PackageCheck className="w-6 h-6" />,
      className: "bg-ink hover:opacity-90 text-canvas",
    },
  }

  const action = actionConfig[order.status]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 60 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className={`bg-surface rounded-2xl border-l-8 ${borderColor} overflow-hidden shadow-sm`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <span className="text-5xl font-extrabold text-ink leading-none">
            #{order.orderNumber}
          </span>
          <UrgencyBadge placedAt={order.placedAt} />
        </div>

        <motion.div
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.25 }}
          className="flex items-center justify-between gap-2 mb-3 flex-wrap"
        >
          <span className="inline-flex items-center gap-2">
            <User className="w-5 h-5 text-muted shrink-0" />
            <span className="text-lg font-bold text-ink">
              {order.consumer?.name ?? "Guest"}
            </span>
          </span>
          {order.consumer?.phone && (
            <a
              href={`tel:${order.consumer.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-primary transition-colors"
            >
              <Phone className="w-4 h-4" />
              {order.consumer.phone}
            </a>
          )}
        </motion.div>

        <div className="flex items-center gap-2 mb-4">
          <TableProperties className="w-5 h-5 text-muted shrink-0" />
          <span className="text-lg font-semibold text-muted">
            {orderDestinationLabel(order)}
          </span>
        </div>

        <div className="bg-surface-elevated rounded-xl p-4 mb-4 space-y-3">
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex items-center gap-3">
              <span className="text-2xl font-extrabold text-primary w-8 shrink-0">
                {item.quantity}×
              </span>
              <span className="text-lg font-semibold text-ink leading-tight">
                {item.menuItem?.name}
              </span>
            </div>
          ))}
        </div>

        {order.specialInstructions && (
          <div className="flex items-start gap-2 bg-warning/10 border border-warning/40 rounded-xl p-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-warning uppercase tracking-wide mb-1">
                Special Instructions
              </p>
              <p className="text-base text-ink font-medium">
                {order.specialInstructions}
              </p>
            </div>
          </div>
        )}

        {action && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onAction}
            disabled={isPending}
            className={`w-full py-5 rounded-2xl font-extrabold text-xl flex items-center justify-center gap-3 transition-colors disabled:opacity-60 ${action.className}`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isPending ? "pending" : "idle"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                {action.icon}
                {isPending ? "Updating..." : action.label}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

function EmptyColumn({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20 gap-4"
    >
      <UtensilsCrossed className="w-14 h-14 text-muted" />
      <p className="text-lg font-semibold text-muted">{label}</p>
    </motion.div>
  )
}

export default function KitchenDisplay() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const restaurantId = user?.restaurantId
  const router = useRouter()
  const [connected, setConnected] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [, setTick] = useState(0)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true)
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true))
      return () => unsub()
    }
  }, [])

  useEffect(() => {
    if (
      hydrated &&
      (!user ||
        !user.restaurantId ||
        (user.role !== "KITCHEN" && user.role !== "MANAGER" && user.role !== "OWNER"))
    ) {
      router.replace("/login")
    }
  }, [user, hydrated, router])

  const { data: orders, refetch } = useQuery({
    queryKey: ["kitchen-orders", restaurantId],
    queryFn: () =>
      api.get(`/api/v1/restaurants/${restaurantId}/orders/active`).then((r) => r.data.data),
    enabled: !!restaurantId,
    refetchInterval: 15000,
  })

  const updateStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      api.patch(`/api/v1/restaurants/${restaurantId}/orders/${orderId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] })
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  })

  const playSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {})
    }
  }, [soundEnabled])

  useEffect(() => {
    if (!restaurantId) return
    const socket = connectSocket()
    socket.on("connect", () => setConnected(true))
    socket.on("disconnect", () => setConnected(false))
    socket.on("order:new", () => {
      playSound()
      refetch()
      toast.success("New order received!")
    })
    socket.on("order:cancelled", () => {
      refetch()
    })
    return () => {
      socket.off("connect")
      socket.off("disconnect")
      socket.off("order:new")
      socket.off("order:cancelled")
    }
  }, [restaurantId, playSound, refetch])

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000)
    return () => clearInterval(interval)
  }, [])

  const newOrders = orders?.filter((o: any) => o.status === "PLACED") || []
  const preparingOrders =
    orders?.filter((o: any) => o.status === "ACCEPTED" || o.status === "PREPARING") || []
  const readyOrders = orders?.filter((o: any) => o.status === "READY") || []

  const nextStatus: Record<string, string> = {
    PLACED: "ACCEPTED",
    ACCEPTED: "PREPARING",
    PREPARING: "READY",
  }

  function handleAction(orderId: string, currentStatus: string) {
    const status = nextStatus[currentStatus]
    if (status) updateStatus.mutate({ orderId, status })
  }

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <audio ref={audioRef} preload="auto">
        <source
          src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczJjqLwODXnF04LWy31OjKfkMxT5PH4OKqZjomTIm+2OKLSC8xYpvL5dqmTSsmhXxkdVuNWm94hINaOVF3f4p5Y3VdjEpmh4N8dIp+cHV8e3FpZGNhaXSAjpWKdl5SU2J/l6eYdU0yLU12mrmycUYnJ0d1osXTqmQzHjlxn87dvW9ALy5Rh7rU3K5vQi8sRnqo0OC+dkkzLkdzocfbsl85Kj96ns/hs3FAMTBOT4i728drPSwuR3iqz+LCfEswK0Jwn8rft3g/LzBHb5zH37h8Ri4rQW+cx960ekUsKz1slcPbsXdAKys7bJPC2rB3Py0rOmqQwNiueD8tKzlpjr3WrHc/LCs4Z4u71at3Py0qN2aJuNOpdj8sKjZliLbRqHY/LCk1ZIe10Kd2PyspNGOGtM+mdjwrKTNihbPPpnY8Kygx"
          type="audio/wav"
        />
      </audio>

      <div className="sticky top-0 z-30 bg-surface border-b border-line px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UtensilsCrossed className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-extrabold tracking-tight">
            Kitchen <span className="text-primary">Display</span>
          </h1>
        </div>
        <div className="flex items-center gap-5">
          <ThemeToggle />

          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${
              soundEnabled
                ? "bg-ink text-canvas"
                : "bg-surface-elevated text-muted"
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
            {soundEnabled ? "Sound On" : "Sound Off"}
          </motion.button>

          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm ${
              connected || !realtimeEnabled
                ? "bg-surface-elevated text-ink"
                : "bg-primary/20 text-primary"
            }`}
          >
            {connected || !realtimeEnabled ? (
              <Wifi className="w-5 h-5" />
            ) : (
              <WifiOff className="w-5 h-5" />
            )}
            {!realtimeEnabled ? "Auto-refresh" : connected ? "Live" : "Reconnecting..."}
          </div>

          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => {
              logout()
              router.push("/login")
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-elevated hover:bg-line text-muted hover:text-ink font-bold text-sm transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-3 flex-1 divide-x divide-line">
        <div className="bg-primary/5 p-5">
          <ColumnHeader icon="🆕" label="New Orders" count={newOrders.length} accentClass="bg-primary/15" />
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {newOrders.length === 0 ? (
                <EmptyColumn label="No new orders" />
              ) : (
                newOrders.map((order: any) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onAction={() => handleAction(order.id, order.status)}
                    isPending={updateStatus.isPending}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="bg-warning/5 p-5">
          <ColumnHeader icon="🔥" label="Cooking" count={preparingOrders.length} accentClass="bg-warning/15" />
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {preparingOrders.length === 0 ? (
                <EmptyColumn label="Nothing cooking yet" />
              ) : (
                preparingOrders.map((order: any) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onAction={() => handleAction(order.id, order.status)}
                    isPending={updateStatus.isPending}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="bg-success/5 p-5">
          <ColumnHeader icon="✅" label="Ready" count={readyOrders.length} accentClass="bg-success/15" />
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {readyOrders.length === 0 ? (
                <EmptyColumn label="No orders ready yet" />
              ) : (
                readyOrders.map((order: any) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onAction={() => handleAction(order.id, order.status)}
                    isPending={updateStatus.isPending}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
