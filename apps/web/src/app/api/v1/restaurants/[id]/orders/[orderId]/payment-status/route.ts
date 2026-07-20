import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, error, handleError, requireRole } from "@/lib/api-utils"
import { confirmOrderPayment } from "@/lib/payments/confirm"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  try {
    const { id: restaurantId, orderId } = await params
    const user = requireRole(request, "CONSUMER")

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { consumerId: true, restaurantId: true, trackingToken: true },
    })
    if (!order || order.consumerId !== user.id || order.restaurantId !== restaurantId) {
      return error("Order not found", 404)
    }

    const status = await confirmOrderPayment(orderId)
    return success({ status, trackingToken: order.trackingToken })
  } catch (err) {
    return handleError(err)
  }
}
