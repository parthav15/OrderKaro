import { NextRequest } from "next/server"
import { Decimal } from "@prisma/client/runtime/library"
import prisma from "@/lib/prisma"
import { success, error, handleError, requireRole, parseBody, AuthError } from "@/lib/api-utils"
import { updateOrderStatusSchema, ORDER_STATUS_FLOW } from "@orderkaro/shared"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  try {
    const { id: canteenId, orderId } = await params
    const user = requireRole(request, "KITCHEN", "COUNTER", "MANAGER", "OWNER")
    const body = await request.json()
    const data = parseBody(updateOrderStatusSchema, body)

    const order = await prisma.order.findFirst({
      where: { id: orderId, canteenId },
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
    if (data.status === "CANCELLED" && order.paymentMethod === "WALLET") {
      paymentStatusUpdate.paymentStatus = "REFUNDED"
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

      if (
        data.status === "CANCELLED" &&
        order.paymentMethod === "WALLET" &&
        order.paymentStatus === "PAID"
      ) {
        const wallet = await tx.wallet.findUnique({ where: { consumerId: order.consumerId } })
        if (wallet) {
          const balanceBefore = new Decimal(wallet.balance.toString())
          const refundAmount = new Decimal(order.totalAmount.toString())
          const balanceAfter = balanceBefore.add(refundAmount)
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: balanceAfter },
          })
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: "CREDIT",
              amount: refundAmount,
              balanceBefore,
              balanceAfter,
              source: "REFUND",
              description: `Refund for cancelled order #${order.orderNumber}`,
              status: "APPROVED",
            },
          })
        }
      }
    })

    const updated = await prisma.order.findUnique({ where: { id: orderId } })
    return success(updated)
  } catch (err) {
    return handleError(err)
  }
}
