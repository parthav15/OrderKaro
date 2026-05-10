"use client"

import { useCallback, useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { toast } from "sonner"
import type { TableRow } from "../useTablesQuery"

interface PendingPosition {
  posX: number | null
  posY: number | null
}

const DEBOUNCE_MS = 250

export function useTablePositions(canteenId: string) {
  const queryClient = useQueryClient()
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const pendingRef = useRef<Map<string, PendingPosition>>(new Map())

  const singleMutation = useMutation({
    mutationFn: async ({ id, posX, posY }: { id: string; posX: number | null; posY: number | null }) => {
      await api.put(`/api/v1/canteens/${canteenId}/tables/${id}`, { posX, posY })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to save position")
      queryClient.invalidateQueries({ queryKey: ["tables", canteenId] })
    },
  })

  const bulkMutation = useMutation({
    mutationFn: async (positions: { id: string; posX: number | null; posY: number | null }[]) => {
      await api.patch(`/api/v1/canteens/${canteenId}/tables/positions`, { positions })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to save positions")
      queryClient.invalidateQueries({ queryKey: ["tables", canteenId] })
    },
  })

  const optimisticUpdate = useCallback(
    (id: string, posX: number | null, posY: number | null) => {
      queryClient.setQueryData<TableRow[]>(["tables", canteenId], (prev) => {
        if (!prev) return prev
        return prev.map((t) => (t.id === id ? { ...t, posX, posY } : t))
      })
    },
    [canteenId, queryClient]
  )

  const queueSave = useCallback(
    (id: string, posX: number | null, posY: number | null) => {
      optimisticUpdate(id, posX, posY)
      pendingRef.current.set(id, { posX, posY })

      const existing = timersRef.current.get(id)
      if (existing) clearTimeout(existing)

      const timer = setTimeout(() => {
        const pending = pendingRef.current.get(id)
        if (!pending) return
        singleMutation.mutate({ id, posX: pending.posX, posY: pending.posY })
        pendingRef.current.delete(id)
        timersRef.current.delete(id)
      }, DEBOUNCE_MS)

      timersRef.current.set(id, timer)
    },
    [optimisticUpdate, singleMutation]
  )

  const flushBulk = useCallback(
    async (positions: { id: string; posX: number | null; posY: number | null }[]) => {
      for (const p of positions) optimisticUpdate(p.id, p.posX, p.posY)
      await bulkMutation.mutateAsync(positions)
    },
    [bulkMutation, optimisticUpdate]
  )

  return { queueSave, flushBulk, optimisticUpdate }
}
