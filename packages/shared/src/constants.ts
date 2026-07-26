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

export const SMS_NOTIFICATIONS = [
  {
    key: "ORDER_PLACED",
    field: "notifyOrderPlaced",
    label: "Order confirmed",
    description: "Text the customer as soon as their order is placed",
    audience: "CUSTOMER",
  },
  {
    key: "ORDER_ACCEPTED",
    field: "notifyOrderAccepted",
    label: "Order accepted",
    description: "Text the customer when you accept their order",
    audience: "CUSTOMER",
  },
  {
    key: "ORDER_PREPARING",
    field: "notifyOrderPreparing",
    label: "Being prepared",
    description: "Text the customer when the kitchen starts preparing",
    audience: "CUSTOMER",
  },
  {
    key: "ORDER_READY",
    field: "notifyOrderReady",
    label: "Ready / out for delivery",
    description: "Text the customer when the order is ready or on its way",
    audience: "CUSTOMER",
  },
  {
    key: "ORDER_COMPLETED",
    field: "notifyOrderCompleted",
    label: "Order completed",
    description: "Text the customer once the order is picked up or delivered",
    audience: "CUSTOMER",
  },
  {
    key: "ORDER_CANCELLED",
    field: "notifyOrderCancelled",
    label: "Order cancelled",
    description: "Text the customer if an order gets cancelled",
    audience: "CUSTOMER",
  },
  {
    key: "OWNER_NEW_ORDER",
    field: "notifyOwnerNewOrder",
    label: "New order alert",
    description: "Text you the moment a new order comes in",
    audience: "OWNER",
  },
  {
    key: "OWNER_ORDER_CANCELLED",
    field: "notifyOwnerOrderCancelled",
    label: "Cancellation alert",
    description: "Text you when a customer cancels their order",
    audience: "OWNER",
  },
  {
    key: "OWNER_DAILY_SUMMARY",
    field: "notifyOwnerDailySummary",
    label: "Daily summary",
    description: "Text you an end-of-day recap of orders and revenue",
    audience: "OWNER",
  },
  {
    key: "OWNER_PLAN_EXPIRING",
    field: "notifyOwnerPlanExpiring",
    label: "Plan expiring",
    description: "Text you a few days before your subscription renews",
    audience: "OWNER",
  },
] as const

export type SmsNotificationKey = (typeof SMS_NOTIFICATIONS)[number]["key"]
export type SmsNotificationField = (typeof SMS_NOTIFICATIONS)[number]["field"]
