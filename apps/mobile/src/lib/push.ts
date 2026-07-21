import { Platform } from "react-native"
import Constants from "expo-constants"
import * as Notifications from "expo-notifications"
import { api } from "./api"

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function registerForPushNotifications(): Promise<void> {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("orders", {
        name: "Orders",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
      })
    }

    const existing = await Notifications.getPermissionsAsync()
    let granted = existing.granted
    if (!granted) {
      const requested = await Notifications.requestPermissionsAsync()
      granted = requested.granted
    }
    if (!granted) return

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants.easConfig as { projectId?: string } | undefined)?.projectId
    if (!projectId) return

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data
    await api.post("/api/v1/consumer/push-token", { token, platform: Platform.OS }, true)
  } catch {
    return
  }
}
