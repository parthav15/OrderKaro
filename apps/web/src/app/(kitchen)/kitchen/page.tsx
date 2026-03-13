"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Wifi, WifiOff, Volume2, VolumeX, Clock, LogOut } from "lucide-react"
import api from "@/lib/api"
import { connectSocket } from "@/lib/socket"
import { useAuthStore } from "@/stores/auth"
import { getTimeSince } from "@/lib/utils"
import { STALE_ORDER_MINUTES } from "@orderkaro/shared"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

function getUrgencyColor(placedAt: string) {
  const minutes = (Date.now() - new Date(placedAt).getTime()) / 60000
  if (minutes > STALE_ORDER_MINUTES.URGENT) return "border-brand-red"
  if (minutes > STALE_ORDER_MINUTES.WARNING) return "border-neutral-400"
  return "border-white"
}

function getUrgencyDot(placedAt: string) {
  const minutes = (Date.now() - new Date(placedAt).getTime()) / 60000
  if (minutes > STALE_ORDER_MINUTES.URGENT) return "bg-brand-red"
  if (minutes > STALE_ORDER_MINUTES.WARNING) return "bg-neutral-400"
  return "bg-white"
}

export default function KitchenDisplay() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const canteenId = user?.canteenId
  const router = useRouter()
  const [connected, setConnected] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!user || !user.canteenId || (user.role !== "KITCHEN" && user.role !== "MANAGER" && user.role !== "OWNER")) {
      router.replace("/login")
    }
  }, [user, router])

  const { data: orders, refetch } = useQuery({
    queryKey: ["kitchen-orders", canteenId],
    queryFn: () =>
      api.get(`/api/v1/canteens/${canteenId}/orders/active`).then((r) => r.data.data),
    enabled: !!canteenId,
    refetchInterval: 15000,
  })

  const updateStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      api.patch(`/api/v1/canteens/${canteenId}/orders/${orderId}/status`, { status }),
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
    if (!canteenId) return

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
  }, [canteenId, playSound, refetch])

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000)
    return () => clearInterval(interval)
  }, [])

  const newOrders = orders?.filter((o: any) => o.status === "PLACED") || []
  const preparingOrders = orders?.filter((o: any) => o.status === "ACCEPTED" || o.status === "PREPARING") || []
  const readyOrders = orders?.filter((o: any) => o.status === "READY") || []

  function handleAction(orderId: string, currentStatus: string) {
    const nextStatus: Record<string, string> = {
      PLACED: "ACCEPTED",
      ACCEPTED: "PREPARING",
      PREPARING: "READY",
      READY: "PICKED_UP",
    }
    const status = nextStatus[currentStatus]
    if (status) {
      updateStatus.mutate({ orderId, status })
    }
  }

  const actionLabel: Record<string, string> = {
    PLACED: "Accept",
    ACCEPTED: "Start Preparing",
    PREPARING: "Mark Ready",
    READY: "Picked Up",
  }

  return (
    <div className="min-h-screen bg-brand-black text-white">
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczJjqLwODXnF04LWy31OjKfkMxT5PH4OKqZjomTIm+2OKLSC8xYpvL5dqmTSsmhXxkdVuNWm94hINaOVF3f4p5Y3VdjEpmh4N8dIp+cHV8e3FpZGNhaXSAjpWKdl5SU2J/l6eYdU0yLU12mrmycUYnJ0d1osXTqmQzHjlxn87dvW9ALy5Rh7rU3K5vQi8sRnqo0OC+dkkzLkdzocfbsl85Kj96ns/hs3FAMTBOT4i728drPSwuR3iqz+LCfEswK0Jwn8rft3g/LzBHb5zH37h8Ri4rQW+cx960ekUsKz1slcPbsXdAKys7bJPC2rB3Py0rOmqQwNiueD8tKzlpjr3WrHc/LCs4Z4u71at3Py0qN2aJuNOpdj8sKjZliLbRqHY/LCk1ZIe10Kd2PyspNGOGtM+mdjwrKTNihbPPpnY8Kygx" type="audio/wav" />
      </audio>

      <div className="sticky top-0 z-30 bg-brand-black border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold">
            Kitchen <span className="text-brand-red">Display</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg hover:bg-neutral-800"
            title={soundEnabled ? "Mute alerts" : "Unmute alerts"}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-neutral-500" />}
          </button>
          <div className="flex items-center gap-2">
            {connected ? (
              <Wifi className="w-5 h-5 text-white" />
            ) : (
              <WifiOff className="w-5 h-5 text-brand-red" />
            )}
            <span className={`text-xs ${connected ? "text-white" : "text-brand-red"}`}>
              {connected ? "Connected" : "Reconnecting..."}
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

      <div className="grid grid-cols-3 gap-0 min-h-[calc(100vh-73px)]">
        <div className="border-r border-neutral-800 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-brand-red" />
            <h2 className="font-bold text-lg">New ({newOrders.length})</h2>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {newOrders.map((order: any) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className={`bg-neutral-900 rounded-xl p-4 border-l-4 ${getUrgencyColor(order.placedAt)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-extrabold">#{order.orderNumber}</span>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${getUrgencyDot(order.placedAt)} animate-pulse`} />
                      <span className="text-xs text-neutral-400">{getTimeSince(order.placedAt)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-400 mb-3">{order.table?.label}</p>
                  <div className="space-y-1 mb-4">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.menuItem?.name}</span>
                      </div>
                    ))}
                  </div>
                  {order.specialInstructions && (
                    <p className="text-xs text-neutral-300 mb-3">Note: {order.specialInstructions}</p>
                  )}
                  <button
                    onClick={() => handleAction(order.id, order.status)}
                    className="w-full py-3 bg-brand-red text-white font-bold rounded-xl text-sm hover:bg-red-700 transition-colors"
                  >
                    {actionLabel[order.status]}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="border-r border-neutral-800 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-neutral-400" />
            <h2 className="font-bold text-lg">Preparing ({preparingOrders.length})</h2>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {preparingOrders.map((order: any) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className={`bg-neutral-900 rounded-xl p-4 border-l-4 ${getUrgencyColor(order.placedAt)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-extrabold">#{order.orderNumber}</span>
                    <div className="flex items-center gap-1 text-xs text-neutral-400">
                      <Clock className="w-3 h-3" />
                      {getTimeSince(order.placedAt)}
                    </div>
                  </div>
                  <p className="text-sm text-neutral-400 mb-3">{order.table?.label}</p>
                  <div className="space-y-1 mb-4">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="text-sm">
                        {item.quantity}x {item.menuItem?.name}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleAction(order.id, order.status)}
                    className="w-full py-3 bg-white text-brand-black font-bold rounded-xl text-sm hover:bg-neutral-100 transition-colors"
                  >
                    {actionLabel[order.status]}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-white" />
            <h2 className="font-bold text-lg">Ready ({readyOrders.length})</h2>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {readyOrders.map((order: any) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="bg-neutral-900 rounded-xl p-4 border-l-4 border-white"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl font-extrabold text-white">#{order.orderNumber}</span>
                    <span className="text-xs text-neutral-400">{order.table?.label}</span>
                  </div>
                  <div className="space-y-1 mb-4">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="text-sm">
                        {item.quantity}x {item.menuItem?.name}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleAction(order.id, order.status)}
                    className="w-full py-3 bg-neutral-700 text-white font-bold rounded-xl text-sm hover:bg-neutral-600 transition-colors"
                  >
                    {actionLabel[order.status]}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
