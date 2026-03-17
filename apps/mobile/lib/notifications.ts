import { Platform } from "react-native"
import api from "./api"

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const Notifications = await import("expo-notifications")
    const Constants = await import("expo-constants")

    if (!Constants.default.isDevice) return null

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== "granted") return null

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("orders", {
        name: "Order Updates",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#DC2626",
      })
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.default.expoConfig?.extra?.eas?.projectId,
    })

    return tokenData.data
  } catch {
    return null
  }
}

export async function sendPushTokenToServer(token: string) {
  try {
    await api.post("/api/v1/consumer/push-token", {
      token,
      platform: Platform.OS,
    })
  } catch {}
}

export async function removePushTokenFromServer(token: string) {
  try {
    await api.delete("/api/v1/consumer/push-token", {
      data: { token },
    })
  } catch {}
}
