import { useEffect, useState } from "react"
import { AppState } from "react-native"

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 3000)
        await fetch("https://clients3.google.com/generate_204", {
          signal: controller.signal,
        })
        clearTimeout(timeout)
        setIsOnline(true)
      } catch {
        setIsOnline(false)
      }
    }

    checkNetwork()

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") checkNetwork()
    })

    const interval = setInterval(checkNetwork, 15000)

    return () => {
      sub.remove()
      clearInterval(interval)
    }
  }, [])

  return isOnline
}
