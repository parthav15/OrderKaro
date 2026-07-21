import { useEffect, useRef, useState } from "react"
import { api } from "./api"

type Outcome = "PAID" | "FAILED" | "PENDING" | "UNKNOWN"

interface PollResult {
  status?: Outcome
  outcome?: Outcome
  [key: string]: unknown
}

export function usePaymentPolling({
  pollUrl,
  pollBody,
  enabled,
  onResolved,
}: {
  pollUrl: string
  pollBody: Record<string, unknown>
  enabled: boolean
  onResolved: (status: Outcome, data: PollResult) => void
}) {
  const [polling, setPolling] = useState(false)
  const resolved = useRef(false)

  useEffect(() => {
    if (!enabled) return
    resolved.current = false
    setPolling(true)

    let active = true
    const interval = setInterval(async () => {
      if (!active || resolved.current) return
      try {
        const data = await api.post<PollResult>(pollUrl, pollBody, true)
        const status = data.status ?? data.outcome ?? "PENDING"
        if (status === "PAID" || status === "FAILED") {
          resolved.current = true
          setPolling(false)
          clearInterval(interval)
          onResolved(status, data)
        }
      } catch {
        return
      }
    }, 3000)

    return () => {
      active = false
      clearInterval(interval)
      setPolling(false)
    }
  }, [enabled, pollUrl])

  return { polling }
}
