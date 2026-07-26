import type { SmsNotificationKey } from "@orderkaro/shared"

export interface SmsContext {
  restaurantName: string
  orderNumber?: number
  orderType?: string
  customerName?: string | null
  itemCount?: number
  total?: string
  orderCount?: number
  revenue?: string
  planName?: string
  expiryDate?: string
}

interface SmsTemplate {
  audience: "CUSTOMER" | "OWNER"
  render: (ctx: SmsContext) => string
}

function orderTypeLabel(orderType?: string): string {
  if (orderType === "DELIVERY") return "Delivery"
  if (orderType === "TAKEAWAY") return "Takeaway"
  return "Dine-in"
}

function greeting(ctx: SmsContext): string {
  return ctx.customerName ? `Hi ${ctx.customerName}, ` : ""
}

export const SMS_TEMPLATES: Record<SmsNotificationKey, SmsTemplate> = {
  ORDER_PLACED: {
    audience: "CUSTOMER",
    render: (c) =>
      `${greeting(c)}your order #${c.orderNumber} at ${c.restaurantName} is confirmed. We'll text you as it progresses.`,
  },
  ORDER_ACCEPTED: {
    audience: "CUSTOMER",
    render: (c) => `${c.restaurantName}: your order #${c.orderNumber} is accepted and will be prepared shortly.`,
  },
  ORDER_PREPARING: {
    audience: "CUSTOMER",
    render: (c) => `${c.restaurantName}: your order #${c.orderNumber} is now being prepared.`,
  },
  ORDER_READY: {
    audience: "CUSTOMER",
    render: (c) =>
      c.orderType === "DELIVERY"
        ? `${c.restaurantName}: your order #${c.orderNumber} is ready and out for delivery.`
        : `${c.restaurantName}: your order #${c.orderNumber} is ready for pickup at the counter.`,
  },
  ORDER_COMPLETED: {
    audience: "CUSTOMER",
    render: (c) => `${c.restaurantName}: order #${c.orderNumber} complete. Thanks for ordering - see you again soon!`,
  },
  ORDER_CANCELLED: {
    audience: "CUSTOMER",
    render: (c) => `${c.restaurantName}: your order #${c.orderNumber} has been cancelled. Contact us with any questions.`,
  },
  OWNER_NEW_ORDER: {
    audience: "OWNER",
    render: (c) =>
      `New order #${c.orderNumber} (${orderTypeLabel(c.orderType)}) at ${c.restaurantName}${
        c.itemCount ? ` - ${c.itemCount} item(s)` : ""
      }${c.total ? `, Rs ${c.total}` : ""}. Open Vision Menu to accept.`,
  },
  OWNER_ORDER_CANCELLED: {
    audience: "OWNER",
    render: (c) =>
      `${c.restaurantName}: order #${c.orderNumber} was just cancelled by the customer. Open Vision Menu for details.`,
  },
  OWNER_DAILY_SUMMARY: {
    audience: "OWNER",
    render: (c) =>
      `${c.restaurantName}: today you had ${c.orderCount ?? 0} order(s) totaling Rs ${
        c.revenue ?? "0"
      }. See the full breakdown in Vision Menu.`,
  },
  OWNER_PLAN_EXPIRING: {
    audience: "OWNER",
    render: (c) =>
      `Your ${c.planName ?? "Vision Menu"} plan expires on ${
        c.expiryDate ?? "soon"
      }. Renew in Vision Menu to keep your features active.`,
  },
}

export const ORDER_STATUS_SMS: Partial<Record<string, SmsNotificationKey>> = {
  ACCEPTED: "ORDER_ACCEPTED",
  PREPARING: "ORDER_PREPARING",
  READY: "ORDER_READY",
  PICKED_UP: "ORDER_COMPLETED",
  CANCELLED: "ORDER_CANCELLED",
}

export const SMS_RESTAURANT_SELECT = {
  id: true,
  name: true,
  smsEnabled: true,
  smsMarginPercent: true,
  whatsappEnabled: true,
  notifyOrderPlaced: true,
  notifyOrderAccepted: true,
  notifyOrderPreparing: true,
  notifyOrderReady: true,
  notifyOrderCompleted: true,
  notifyOrderCancelled: true,
  notifyOwnerNewOrder: true,
  notifyOwnerOrderCancelled: true,
  notifyOwnerDailySummary: true,
  notifyOwnerPlanExpiring: true,
} as const

export interface WhatsAppTemplate {
  name: string
  text: string
  variables: (ctx: SmsContext) => Record<string, string>
}

export const WHATSAPP_TEMPLATES: Record<SmsNotificationKey, WhatsAppTemplate> = {
  ORDER_PLACED: {
    name: "vm_order_placed",
    text: "Hi {{1}}, your order #{{2}} at {{3}} is confirmed. We'll keep you updated right here. — Vision Menu",
    variables: (c) => ({ "1": c.customerName || "there", "2": String(c.orderNumber), "3": c.restaurantName }),
  },
  ORDER_ACCEPTED: {
    name: "vm_order_accepted",
    text: "Good news! {{1}} has accepted your order #{{2}} and will start preparing it shortly.",
    variables: (c) => ({ "1": c.restaurantName, "2": String(c.orderNumber) }),
  },
  ORDER_PREPARING: {
    name: "vm_order_preparing",
    text: "Your order #{{1}} at {{2}} is now being prepared. Hang tight!",
    variables: (c) => ({ "1": String(c.orderNumber), "2": c.restaurantName }),
  },
  ORDER_READY: {
    name: "vm_order_ready",
    text: "Great news! Your order #{{1}} from {{2}} is now ready for {{3}}. Thank you for ordering with Vision Menu.",
    variables: (c) => ({
      "1": String(c.orderNumber),
      "2": c.restaurantName,
      "3": c.orderType === "DELIVERY" ? "delivery" : "pickup",
    }),
  },
  ORDER_COMPLETED: {
    name: "vm_order_completed",
    text: "Order #{{1}} at {{2}} is complete. Thanks for ordering — see you again soon!",
    variables: (c) => ({ "1": String(c.orderNumber), "2": c.restaurantName }),
  },
  ORDER_CANCELLED: {
    name: "vm_order_cancelled",
    text: "Your order #{{1}} at {{2}} has been cancelled. Please reach out to us with any questions.",
    variables: (c) => ({ "1": String(c.orderNumber), "2": c.restaurantName }),
  },
  OWNER_NEW_ORDER: {
    name: "vm_owner_new_order",
    text: "New order #{{1}} ({{2}}) at {{3}} — Rs {{4}}. Open Vision Menu to accept.",
    variables: (c) => ({
      "1": String(c.orderNumber),
      "2": orderTypeLabel(c.orderType),
      "3": c.restaurantName,
      "4": c.total || "-",
    }),
  },
  OWNER_ORDER_CANCELLED: {
    name: "vm_owner_order_cancelled",
    text: "Order #{{1}} at {{2}} was just cancelled by the customer. Open Vision Menu to review the details.",
    variables: (c) => ({ "1": String(c.orderNumber), "2": c.restaurantName }),
  },
  OWNER_DAILY_SUMMARY: {
    name: "vm_owner_daily_summary",
    text: "{{1}}: today you had {{2}} orders totaling Rs {{3}}. Open Vision Menu to see the full breakdown.",
    variables: (c) => ({
      "1": c.restaurantName,
      "2": String(c.orderCount ?? 0),
      "3": c.revenue ?? "0",
    }),
  },
  OWNER_PLAN_EXPIRING: {
    name: "vm_owner_plan_expiring",
    text: "Your {{1}} plan expires on {{2}}. Renew in Vision Menu to keep your menu, orders and notifications running.",
    variables: (c) => ({ "1": c.planName ?? "Vision Menu", "2": c.expiryDate ?? "soon" }),
  },
}
