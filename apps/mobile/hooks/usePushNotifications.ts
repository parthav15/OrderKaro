import { useEffect, useRef } from "react"
import { Platform } from "react-native"
import { useRouter } from "expo-router"
import { useAuthStore } from "@/stores/auth"

export function usePushNotifications() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const tokenSent = useRef(false)

  useEffect(() => {
    if (!user || tokenSent.current) return

    const setup = async () => {
      try {
        const Notifications = await import("expo-notifications")

        const { status: existingStatus } = await Notifications.getPermissionsAsync()
        let finalStatus = existingStatus

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync()
          finalStatus = status
        }

        if (finalStatus !== "granted") return

        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("orders", {
            name: "Order Updates",
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#DC2626",
          })
        }

        const Constants = await import("expo-constants")
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.default.expoConfig?.extra?.eas?.projectId,
        })

        const api = (await import("@/lib/api")).default
        await api.post("/api/v1/consumer/push-token", {
          token: tokenData.data,
          platform: Platform.OS,
        })

        tokenSent.current = true
      } catch {}
    }

    setup()
  }, [user])

  useEffect(() => {
    let sub: any

    const setupListener = async () => {
      try {
        const Notifications = await import("expo-notifications")
        sub = Notifications.addNotificationResponseReceivedListener(
          (response) => {
            const data = response.notification.request.content.data
            if (data?.trackingToken) {
              router.push(`/track/${data.trackingToken}`)
            }
          }
        )
      } catch {}
    }

    setupListener()

    return () => {
      if (sub) sub.remove()
    }
  }, [router])
}
