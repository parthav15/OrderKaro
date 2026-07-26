import type { SmsNotificationKey } from "@orderkaro/shared"

export interface SmsContext {
  restaurantName: string
  orderNumber: number
  orderType: string
  customerName?: string | null
  itemCount?: number
  total?: string
}

interface SmsTemplate {
  audience: "CUSTOMER" | "OWNER"
  render: (ctx: SmsContext) => string
}

function orderTypeLabel(orderType: string): string {
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
  notifyOrderPlaced: true,
  notifyOrderAccepted: true,
  notifyOrderPreparing: true,
  notifyOrderReady: true,
  notifyOrderCompleted: true,
  notifyOrderCancelled: true,
  notifyOwnerNewOrder: true,
} as const
