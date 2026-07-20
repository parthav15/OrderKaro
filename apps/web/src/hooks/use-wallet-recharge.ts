"use client"

import { useState, useCallback } from "react"
import api from "@/lib/api"
import { toast } from "sonner"

export function useWalletRecharge() {
  const [recharging, setRecharging] = useState(false)

  const recharge = useCallback(
    async (restaurantId: string, amount: number): Promise<boolean> => {
      setRecharging(true)
      try {
        const { data } = await api.post(
          `/api/v1/restaurants/${restaurantId}/wallet/topup`,
          { amount }
        )
        const redirectUrl = data.data?.redirectUrl
        if (!redirectUrl) {
          toast.error("Could not start the top-up")
          setRecharging(false)
          return false
        }
        window.location.href = redirectUrl
        return true
      } catch (err) {
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          "Could not start the top-up"
        toast.error(message)
        setRecharging(false)
        return false
      }
    },
    []
  )

  return { recharging, recharge }
}
