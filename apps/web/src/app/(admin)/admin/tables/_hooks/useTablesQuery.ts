"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"

export interface TableRow {
  id: string
  canteenId: string
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

export function useTablesQuery(canteenId: string) {
  return useQuery<TableRow[]>({
    queryKey: ["tables", canteenId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/canteens/${canteenId}/tables`)
      return data.data
    },
    enabled: !!canteenId,
    staleTime: 15_000,
  })
}
