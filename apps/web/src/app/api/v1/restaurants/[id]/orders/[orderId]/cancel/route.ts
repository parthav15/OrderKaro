import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, error, handleError, requireRole, AuthError } from "@/lib/api-utils"
import { dispatchSms } from "@/lib/sms/dispatch"
import { SMS_RESTAURANT_SELECT } from "@/lib/sms/templates"
import { resolveAppUrl } from "@/lib/app-url"
import { CANCEL_WINDOW_MS } from "@orderkaro/shared"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  try {
    const { id: restaurantId, orderId } = await params
    const user = requireRole(request, "CONSUMER")

    const order = await prisma.order.findFirst({
      where: { id: orderId, restaurantId, consumerId: user.id },
      include: {
        restaurant: { select: { ...SMS_RESTAURANT_SELECT, owner: { select: { phone: true } } } },
      },
    })

    if (!order) return error("Order not found", 404)

    const isPlaced = order.status === "PLACED"
    const isAcceptedWithinWindow =
      order.status === "ACCEPTED" &&
      order.acceptedAt !== null &&
      Date.now() - new Date(order.acceptedAt).getTime() <= CANCEL_WINDOW_MS

    if (!isPlaced && !isAcceptedWithinWindow) {
      throw new AuthError("Order cannot be cancelled at this stage", 400)
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
      })

      await tx.orderStatusLog.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: "CANCELLED",
          changedBy: user.id,
          note: "Cancelled by consumer",
        },
      })
    })

    if (
      (order.restaurant.smsEnabled || order.restaurant.whatsappEnabled) &&
      order.restaurant.notifyOwnerOrderCancelled
    ) {
      await dispatchSms({
        restaurant: order.restaurant,
        key: "OWNER_ORDER_CANCELLED",
        toPhone: order.restaurant.owner.phone,
        context: {
          restaurantName: order.restaurant.name,
          orderNumber: order.orderNumber,
          orderType: order.orderType,
        },
        orderId: order.id,
        statusCallbackUrl: `${resolveAppUrl(request)}/api/v1/sms/status`,
      })
    }

    return success({ message: "Order cancelled successfully" })
  } catch (err) {
    return handleError(err)
  }
}
