"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"

export interface TableRow {
  id: string
  restaurantId: string
  label: string
  section: string | null
  qrToken: string
  isActive: boolean
  posX: number | null
  posY: number | null
  createdAt: string
  updatedAt: string
  activeOrderCount: number
  todayOrderCount: number
}

export function useTablesQuery(restaurantId: string) {
  return useQuery<TableRow[]>({
    queryKey: ["tables", restaurantId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/restaurants/${restaurantId}/tables`)
      return data.data
    },
    enabled: !!restaurantId,
    staleTime: 15_000,
  })
}
