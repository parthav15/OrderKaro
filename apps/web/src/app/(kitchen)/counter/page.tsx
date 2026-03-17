"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Wifi,
  WifiOff,
  CheckCircle2,
  LogOut,
  HandshakeIcon,
  PackageCheck,
  X,
} from "lucide-react"
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

function ConfirmPickupDialog({
  order,
  onConfirm,
  onCancel,
  isPending,
}: {
  order: ReadyOrder
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-6"
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 30 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className="bg-neutral-900 border-2 border-white rounded-3xl p-8 w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <PackageCheck className="w-10 h-10 text-white" />
              <span className="text-8xl font-extrabold text-white leading-none">
                #{order.orderNumber}
              </span>
            </div>
            <p className="text-2xl font-bold text-neutral-300">Give this order to the student?</p>
          </div>

          <div className="bg-neutral-800 rounded-2xl p-5 mb-8">
            <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-3">Items in this order</p>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="text-2xl font-extrabold text-brand-red w-8 shrink-0">
                    {item.quantity}×
                  </span>
                  <span className="text-xl font-semibold text-white">{item.menuItem.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onConfirm}
              disabled={isPending}
              className="w-full py-6 bg-brand-red hover:bg-red-700 text-white rounded-2xl font-extrabold text-2xl flex items-center justify-center gap-3 transition-colors disabled:opacity-60"
            >
              <HandshakeIcon className="w-8 h-8" />
              {isPending ? "Updating..." : "Yes — Order Given"}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onCancel}
              className="w-full py-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-2xl font-bold text-xl flex items-center justify-center gap-2 transition-colors"
            >
              <X className="w-6 h-6" />
              Cancel
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function CounterDisplay() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const canteenId = user?.canteenId
  const router = useRouter()
  const [connected, setConnected] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [confirmOrder, setConfirmOrder] = useState<ReadyOrder | null>(null)

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
        !user.canteenId ||
        (user.role !== "COUNTER" && user.role !== "MANAGER" && user.role !== "OWNER"))
    ) {
      router.replace("/login")
    }
  }, [user, hydrated, router])

  const { data: allOrders, refetch } = useQuery<ReadyOrder[]>({
    queryKey: ["counter-orders", canteenId],
    queryFn: () =>
      api.get(`/api/v1/canteens/${canteenId}/orders/active`).then((r) => r.data.data),
    enabled: !!canteenId,
    refetchInterval: 15000,
  })

  const readyOrders = allOrders?.filter((o) => o.status === "READY") ?? []

  const markPickedUp = useMutation({
    mutationFn: (orderId: string) =>
      api.patch(`/api/v1/canteens/${canteenId}/orders/${orderId}/status`, {
        status: "PICKED_UP",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["counter-orders"] })
      setConfirmOrder(null)
      toast.success("Order marked as picked up")
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to update"),
  })

  const handleCardTap = useCallback((order: ReadyOrder) => {
    setConfirmOrder(order)
  }, [])

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
    <div className="min-h-screen bg-brand-black text-white flex flex-col">
      <div className="sticky top-0 z-30 bg-neutral-950 border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HandshakeIcon className="w-7 h-7 text-brand-red" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Counter <span className="text-brand-red">Display</span>
            </h1>
            <p className="text-neutral-400 text-sm font-medium">Tap an order to give it to the student</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm ${
              connected ? "bg-neutral-800 text-white" : "bg-brand-red/20 text-brand-red"
            }`}
          >
            {connected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            {connected ? "Live" : "Reconnecting..."}
          </div>

          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => {
              logout()
              router.push("/login")
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-bold text-sm transition-colors"
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
              <CheckCircle2 className="w-24 h-24 text-neutral-700" />
              <p className="text-3xl font-extrabold text-neutral-500">All clear!</p>
              <p className="text-xl text-neutral-600 font-medium">No orders to give right now</p>
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
                  <motion.button
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    whileHover={{ scale: 1.04, y: -6 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    onClick={() => handleCardTap(order)}
                    className="bg-neutral-900 border-2 border-white hover:border-brand-red rounded-3xl p-6 flex flex-col items-center text-center transition-colors group"
                  >
                    <motion.span
                      animate={{ scale: [1, 1.04, 1] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                      className="text-7xl font-extrabold text-white group-hover:text-brand-red transition-colors leading-none mb-5"
                    >
                      #{order.orderNumber}
                    </motion.span>

                    <div className="w-full space-y-2 mb-5">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 justify-center">
                          <span className="text-lg font-extrabold text-brand-red">{item.quantity}×</span>
                          <span className="text-base font-semibold text-neutral-300 truncate">
                            {item.menuItem.name}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="w-full py-3.5 bg-white/10 group-hover:bg-brand-red/20 rounded-2xl transition-colors flex items-center justify-center gap-2">
                      <HandshakeIcon className="w-5 h-5 text-white group-hover:text-brand-red transition-colors" />
                      <span className="text-sm font-extrabold text-white group-hover:text-brand-red transition-colors uppercase tracking-wide">
                        Tap to Give Order
                      </span>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {confirmOrder && (
        <ConfirmPickupDialog
          order={confirmOrder}
          onConfirm={() => markPickedUp.mutate(confirmOrder.id)}
          onCancel={() => setConfirmOrder(null)}
          isPending={markPickedUp.isPending}
        />
      )}
    </div>
  )
}
