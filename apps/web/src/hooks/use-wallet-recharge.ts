"use client"

import { useState, useCallback } from "react"
import api from "@/lib/api"
import { toast } from "sonner"

export function useWalletRecharge() {
  const [recharging, setRecharging] = useState(false)

  const recharge = useCallback(
    async (restaurantId: string, amount: number): Promise<any | null> => {
      setRecharging(true)
      try {
        const { data } = await api.post(
          `/api/v1/restaurants/${restaurantId}/wallet/topup`,
          { amount }
        )
        const session = data.data
        if (!session?.redirectUrl) {
          toast.error("Could not start the top-up")
          setRecharging(false)
          return null
        }
        setRecharging(false)
        return session
      } catch (err) {
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          "Could not start the top-up"
        toast.error(message)
        setRecharging(false)
        return null
      }
    },
    []
  )

  return { recharging, recharge }
}
