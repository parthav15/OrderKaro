"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import {
  Wifi,
  WifiOff,
  CheckCircle2,
  LogOut,
  HandshakeIcon,
} from "lucide-react"
import api from "@/lib/api"
import { connectSocket, realtimeEnabled } from "@/lib/socket"
import { useAuthStore } from "@/stores/auth"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { orderDestinationLabel } from "@/lib/utils"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface ReadyOrder {
  id: string
  orderNumber: number
  status: string
  placedAt: string
  orderType?: string
  deliveryLocation?: string | null
  table?: { label?: string | null } | null
  items: Array<{
    id: string
    quantity: number
    menuItem: { name: string }
  }>
}

export default function CounterDisplay() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const restaurantId = user?.restaurantId
  const router = useRouter()
  const [connected, setConnected] = useState(false)
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
        (user.role !== "COUNTER" && user.role !== "MANAGER" && user.role !== "OWNER"))
    ) {
      router.replace("/login")
    }
  }, [user, hydrated, router])

  const { data: allOrders, refetch } = useQuery<ReadyOrder[]>({
    queryKey: ["counter-orders", restaurantId],
    queryFn: () =>
      api.get(`/api/v1/restaurants/${restaurantId}/orders/active`).then((r) => r.data.data),
    enabled: !!restaurantId,
    refetchInterval: 15000,
  })

  const readyOrders = allOrders?.filter((o) => o.status === "READY") ?? []

  useEffect(() => {
    if (!restaurantId) return
    const socket = connectSocket()
    socket.on("connect", () => setConnected(true))
    socket.on("disconnect", () => setConnected(false))
    socket.on("order:status", () => {
      refetch()
    })
    socket.on("order:ready", (data: { orderNumber: number }) => {
      toast.success(`Order #${data.orderNumber} is ready for pickup!`)
      refetch()
    })
    return () => {
      socket.off("connect")
      socket.off("disconnect")
      socket.off("order:status")
      socket.off("order:ready")
    }
  }, [restaurantId, refetch])

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <div className="sticky top-0 z-30 bg-surface border-b border-line px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HandshakeIcon className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Counter <span className="text-primary">Display</span>
            </h1>
            <p className="text-muted text-sm font-medium">Orders ready for pickup</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />

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

      <div className="flex-1 p-8">
        <AnimatePresence mode="wait">
          {readyOrders.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-40 gap-6"
            >
              <CheckCircle2 className="w-24 h-24 text-muted" />
              <p className="text-3xl font-extrabold text-muted">All clear!</p>
              <p className="text-xl text-muted font-medium">No orders to give right now</p>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {readyOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    whileHover={{ y: -3 }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className="bg-surface border-2 border-ink rounded-3xl p-6 flex flex-col items-center text-center shadow-sm"
                  >
                    <motion.span
                      animate={{ scale: [1, 1.04, 1] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                      className="text-7xl font-extrabold text-ink leading-none mb-2"
                    >
                      #{order.orderNumber}
                    </motion.span>

                    <span className="text-base font-bold text-muted uppercase tracking-wide mb-5">
                      {orderDestinationLabel(order)}
                    </span>

                    <div className="w-full space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 justify-center">
                          <span className="text-lg font-extrabold text-primary">{item.quantity}×</span>
                          <span className="text-base font-semibold text-muted truncate">
                            {item.menuItem.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
