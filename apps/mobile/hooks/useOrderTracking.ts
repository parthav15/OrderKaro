import { useEffect, useState, useCallback, useRef } from "react"
import { connectSocket, disconnectSocket } from "@/lib/socket"
import api from "@/lib/api"

interface OrderStatus {
  id: string
  orderNumber: number
  status: string
  placedAt: string
  acceptedAt: string | null
  preparingAt: string | null
  readyAt: string | null
  pickedUpAt: string | null
  cancelledAt: string | null
  items: Array<{
    name: string
    quantity: number
    totalPrice: number
  }>
  totalAmount: number
  trackingToken: string
}

export function useOrderTracking(orderId: string | null, canteenId: string | null) {
  const [order, setOrder] = useState<OrderStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchOrder = useCallback(async () => {
    if (!orderId || !canteenId) return
    try {
      const { data } = await api.get(
        `/api/v1/canteens/${canteenId}/orders/${orderId}`
      )
      setOrder(data.data)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [orderId, canteenId])

  useEffect(() => {
    if (!orderId) return

    fetchOrder()

    const socket = connectSocket()
    socket.emit("order:subscribe", orderId)

    socket.on("order:status", (data: any) => {
      if (data.orderId === orderId) {
        setOrder((prev) => (prev ? { ...prev, ...data } : prev))
      }
    })

    socket.on("order:ready", (data: any) => {
      if (data.orderId === orderId) {
        setOrder((prev) => (prev ? { ...prev, status: "READY", readyAt: new Date().toISOString() } : prev))
      }
    })

    socket.on("order:cancelled", (data: any) => {
      if (data.orderId === orderId) {
        setOrder((prev) => (prev ? { ...prev, status: "CANCELLED", cancelledAt: new Date().toISOString() } : prev))
      }
    })

    intervalRef.current = setInterval(fetchOrder, 5000)

    return () => {
      socket.emit("order:unsubscribe", orderId)
      socket.off("order:status")
      socket.off("order:ready")
      socket.off("order:cancelled")
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [orderId, fetchOrder])

  return { order, loading, refetch: fetchOrder }
}
