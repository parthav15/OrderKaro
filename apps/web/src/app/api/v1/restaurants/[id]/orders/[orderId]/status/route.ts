import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, error, handleError, requireRole, parseBody, AuthError } from "@/lib/api-utils"
import { sendPushToConsumer } from "@/lib/push-notifications"
import { dispatchSms } from "@/lib/sms/dispatch"
import { ORDER_STATUS_SMS, SMS_RESTAURANT_SELECT } from "@/lib/sms/templates"
import { resolveAppUrl } from "@/lib/app-url"
import { updateOrderStatusSchema, ORDER_STATUS_FLOW } from "@orderkaro/shared"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  try {
    const { id: restaurantId, orderId } = await params
    const user = requireRole(request, "KITCHEN", "COUNTER", "MANAGER", "OWNER")
    const body = await request.json()
    const data = parseBody(updateOrderStatusSchema, body)

    const order = await prisma.order.findFirst({
      where: { id: orderId, restaurantId },
      include: {
        restaurant: { select: SMS_RESTAURANT_SELECT },
        consumer: { select: { name: true, phone: true } },
      },
    })

    if (!order) return error("Order not found", 404)

    const allowedNext = ORDER_STATUS_FLOW[order.status] ?? []
    if (!allowedNext.includes(data.status)) {
      throw new AuthError(`Cannot transition from ${order.status} to ${data.status}`, 400)
    }

    const now = new Date()
    const timestampUpdate: Record<string, Date> = {}
    if (data.status === "ACCEPTED") timestampUpdate.acceptedAt = now
    if (data.status === "PREPARING") timestampUpdate.preparingAt = now
    if (data.status === "READY") timestampUpdate.readyAt = now
    if (data.status === "PICKED_UP") timestampUpdate.pickedUpAt = now
    if (data.status === "CANCELLED") timestampUpdate.cancelledAt = now

    const paymentStatusUpdate: Record<string, unknown> = {}
    if (data.status === "PICKED_UP" && order.paymentMethod === "CASH") {
      paymentStatusUpdate.paymentStatus = "PAID"
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: data.status,
          ...timestampUpdate,
          ...paymentStatusUpdate,
        },
      })

      await tx.orderStatusLog.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: data.status,
          changedBy: user.id,
          note: data.note,
        },
      })
    })

    const updated = await prisma.order.findUnique({ where: { id: orderId } })

    const smsKey = ORDER_STATUS_SMS[data.status]
    let smsSent = false
    if (smsKey) {
      smsSent = await dispatchSms({
        restaurant: order.restaurant,
        key: smsKey,
        toPhone: order.consumer.phone,
        context: {
          restaurantName: order.restaurant.name,
          orderNumber: order.orderNumber,
          orderType: order.orderType,
          customerName: order.consumer.name,
        },
        orderId,
        statusCallbackUrl: `${resolveAppUrl(request)}/api/v1/sms/status`,
      })
    }

    if (data.status === "READY" && !smsSent) {
      sendPushToConsumer(
        order.consumerId,
        "Order Ready!",
        `Your order #${order.orderNumber} is ready for pickup at the counter.`,
        { trackingToken: order.trackingToken || "", orderId }
      )
    }

    if (data.status === "CANCELLED" && !smsSent) {
      sendPushToConsumer(
        order.consumerId,
        "Order Cancelled",
        `Your order #${order.orderNumber} has been cancelled.`,
        { trackingToken: order.trackingToken || "", orderId }
      )
    }

    return success(updated)
  } catch (err) {
    return handleError(err)
  }
}
