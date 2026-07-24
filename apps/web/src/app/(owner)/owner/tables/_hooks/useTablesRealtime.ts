"use client"

import { useEffect, useState, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { connectSocket } from "@/lib/socket"

interface TableActivity {
  pulseAt: number
  activeOrderCount: number
}

export function useTablesRealtime(restaurantId: string | null) {
  const queryClient = useQueryClient()
  const [activity, setActivity] = useState<Record<string, TableActivity>>({})

  const pulse = useCallback((tableId: string, delta: number) => {
    setActivity((prev) => {
      const current = prev[tableId] ?? { pulseAt: 0, activeOrderCount: 0 }
      const next = {
        pulseAt: Date.now(),
        activeOrderCount: Math.max(0, current.activeOrderCount + delta),
      }
      return { ...prev, [tableId]: next }
    })
  }, [])

  useEffect(() => {
    if (!restaurantId) return

    let socket: ReturnType<typeof connectSocket> | null = null
    try {
      socket = connectSocket()
    } catch {
      return
    }

    const onNewOrder = (order: any) => {
      if (!order?.tableId) return
      pulse(order.tableId, +1)
      queryClient.invalidateQueries({ queryKey: ["tables", restaurantId] })
    }

    const onStatus = (payload: any) => {
      if (!payload?.orderId) return
      if (payload.status === "PICKED_UP" || payload.status === "CANCELLED") {
        queryClient.invalidateQueries({ queryKey: ["tables", restaurantId] })
      }
    }

    const onCancelled = () => {
      queryClient.invalidateQueries({ queryKey: ["tables", restaurantId] })
    }

    socket.on("order:new", onNewOrder)
    socket.on("order:status", onStatus)
    socket.on("order:cancelled", onCancelled)

    return () => {
      socket?.off("order:new", onNewOrder)
      socket?.off("order:status", onStatus)
      socket?.off("order:cancelled", onCancelled)
    }
  }, [restaurantId, queryClient, pulse])

  return { activity }
}
