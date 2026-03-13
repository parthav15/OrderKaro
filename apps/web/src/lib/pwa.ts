export function registerServiceWorker() {
  if (typeof window === "undefined") return
  if (!("serviceWorker" in navigator)) return

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => {})
  })
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined") return "denied"
  if (!("Notification" in window)) return "denied"
  if (Notification.permission === "granted") return "granted"
  if (Notification.permission === "denied") return "denied"

  const result = await Notification.requestPermission()
  return result
}

export function showOrderReadyNotification(orderNumber: number, orderId: string, slug: string) {
  if (typeof window === "undefined") return
  if (!("Notification" in window)) return
  if (Notification.permission !== "granted") return

  const notification = new Notification("Your order is ready!", {
    body: `Order #${orderNumber} is ready for pickup at the counter.`,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: `order-ready-${orderId}`,
  })

  notification.onclick = () => {
    window.focus()
    window.location.href = `/${slug}/order/${orderId}`
    notification.close()
  }
}

export function isNotificationSupported(): boolean {
  if (typeof window === "undefined") return false
  return "Notification" in window
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof window === "undefined") return "default"
  if (!("Notification" in window)) return "denied"
  return Notification.permission
}
