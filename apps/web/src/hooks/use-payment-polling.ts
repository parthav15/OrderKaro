"use client"

import { useEffect, useRef, useState } from "react"
import api from "@/lib/api"

type PaymentStatus = "PAID" | "PENDING" | "FAILED" | "UNKNOWN"

interface UsePaymentPollingArgs {
  pollUrl: string | undefined
  pollBody: Record<string, unknown> | undefined
  enabled: boolean
  onResolved: (status: PaymentStatus, data: any) => void
}

export function usePaymentPolling({ pollUrl, pollBody, enabled, onResolved }: UsePaymentPollingArgs) {
  const [polling, setPolling] = useState(false)
  const onResolvedRef = useRef(onResolved)
  onResolvedRef.current = onResolved

  useEffect(() => {
    if (!enabled || !pollUrl || !pollBody) {
      setPolling(false)
      return
    }

    let cancelled = false
    setPolling(true)

    const tick = async () => {
      try {
        const res = await api.post(pollUrl, pollBody)
        const data = res.data?.data
        const status: PaymentStatus = data?.status ?? data?.outcome ?? "UNKNOWN"
        if (cancelled) return
        if (status === "PAID" || status === "FAILED") {
          cancelled = true
          setPolling(false)
          clearInterval(interval)
          onResolvedRef.current(status, data)
        }
      } catch {}
    }

    const interval = setInterval(tick, 3000)
    tick()

    return () => {
      cancelled = true
      setPolling(false)
      clearInterval(interval)
    }
  }, [enabled, pollUrl, pollBody])

  return { polling }
}
