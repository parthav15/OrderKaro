export const ORDER_STATUSES = [
  "PLACED",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "PICKED_UP",
  "CANCELLED",
] as const

export const STAFF_ROLES = ["MANAGER", "KITCHEN", "COUNTER"] as const

export const PAYMENT_STATUSES = ["PENDING", "PAID", "REFUNDED"] as const

export const PAYMENT_METHODS = ["CASH", "ONLINE"] as const

export const CUSTOMIZATION_TYPES = ["SINGLE_SELECT", "MULTI_SELECT"] as const

export const ORDER_STATUS_FLOW: Record<string, string[]> = {
  PLACED: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY"],
  READY: [],
  PICKED_UP: [],
  CANCELLED: [],
}

export const CANCEL_WINDOW_MS = 60_000

export const MAX_ACTIVE_ORDERS_PER_SESSION = 3

export const STALE_ORDER_MINUTES = {
  WARNING: 10,
  URGENT: 20,
}

export const AUTO_PICKUP_MINUTES = 60
