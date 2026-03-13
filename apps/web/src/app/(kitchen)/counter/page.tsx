"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Wifi, WifiOff, CheckCircle2, LogOut } from "lucide-react"
import api from "@/lib/api"
import { connectSocket } from "@/lib/socket"
import { useAuthStore } from "@/stores/auth"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ReadyOrder {
  id: string
  orderNumber: number
  status: string
  placedAt: string
  items: Array<{
    id: string
    quantity: number
    menuItem: { name: string }
  }>
}

export default function CounterDisplay() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const canteenId = user?.canteenId
  const router = useRouter()
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!user || !user.canteenId || (user.role !== "COUNTER" && user.role !== "MANAGER" && user.role !== "OWNER")) {
      router.replace("/login")
    }
  }, [user, router])

  const { data: allOrders, refetch } = useQuery<ReadyOrder[]>({
    queryKey: ["counter-orders", canteenId],
    queryFn: () =>
      api
        .get(`/api/v1/canteens/${canteenId}/orders/active`)
        .then((r) => r.data.data),
    enabled: !!canteenId,
    refetchInterval: 15000,
  })

  const readyOrders = allOrders?.filter((o) => o.status === "READY") ?? []

  const markPickedUp = useMutation({
    mutationFn: (orderId: string) =>
      api.patch(`/api/v1/canteens/${canteenId}/orders/${orderId}/status`, {
        status: "PICKED_UP",
      }),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ["counter-orders"] })
      toast.success("Order marked as picked up")
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Failed to update"),
  })

  const handlePickedUp = useCallback(
    (orderId: string, orderNumber: number) => {
      if (confirm(`Mark Order #${orderNumber} as Picked Up?`)) {
        markPickedUp.mutate(orderId)
      }
    },
    [markPickedUp]
  )

  useEffect(() => {
    if (!canteenId) return

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
  }, [canteenId, refetch])

  return (
    <div className="min-h-screen bg-brand-black text-white">
      <div className="sticky top-0 z-30 bg-brand-black border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold">
            Counter <span className="text-brand-red">Display</span>
          </h1>
          <p className="text-neutral-500 text-sm">Orders ready for pickup</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {connected ? (
              <Wifi className="w-5 h-5 text-white" />
            ) : (
              <WifiOff className="w-5 h-5 text-brand-red" />
            )}
            <span
              className={`text-xs ${connected ? "text-white" : "text-brand-red"}`}
            >
              {connected ? "Live" : "Reconnecting..."}
            </span>
          </div>
          <button
            onClick={() => { logout(); router.push("/login") }}
            className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-6">
        {readyOrders.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32"
          >
            <CheckCircle2 className="w-16 h-16 text-neutral-700 mb-4" />
            <p className="text-xl font-semibold text-neutral-500">
              No orders ready
            </p>
            <p className="text-neutral-600 text-sm mt-1">
              Ready orders will appear here
            </p>
          </motion.div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <AnimatePresence>
            {readyOrders.map((order) => (
              <motion.button
                key={order.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={() => handlePickedUp(order.id, order.orderNumber)}
                className="bg-neutral-900 border-2 border-white rounded-2xl p-6 flex flex-col items-center text-center hover:border-brand-red transition-colors group"
              >
                <motion.span
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  className="text-6xl font-extrabold text-white group-hover:text-brand-red transition-colors"
                >
                  #{order.orderNumber}
                </motion.span>

                <div className="mt-4 space-y-1 w-full">
                  {order.items.slice(0, 3).map((item) => (
                    <p key={item.id} className="text-xs text-neutral-400 truncate">
                      {item.quantity}× {item.menuItem.name}
                    </p>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-xs text-neutral-500">
                      +{order.items.length - 3} more
                    </p>
                  )}
                </div>

                <div className="mt-4 px-3 py-1.5 bg-white/10 rounded-xl group-hover:bg-brand-red/10 transition-colors">
                  <p className="text-xs font-semibold text-white group-hover:text-brand-red transition-colors">
                    Tap to confirm pickup
                  </p>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
