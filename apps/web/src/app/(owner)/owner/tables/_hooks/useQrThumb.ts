"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"

interface QrPayload {
  url: string
  qrDataUrl: string
}

export function useQrThumb(restaurantId: string | null, tableId: string | null) {
  return useQuery<QrPayload>({
    queryKey: ["table-qr", restaurantId, tableId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/restaurants/${restaurantId}/tables/${tableId}/qr`)
      return data.data
    },
    enabled: !!restaurantId && !!tableId,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })
}
