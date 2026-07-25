import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, error, handleError, requireRole, AuthError } from "@/lib/api-utils"
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

    return success({ message: "Order cancelled successfully" })
  } catch (err) {
    return handleError(err)
  }
}
