import { NextRequest } from "next/server"
import { Decimal } from "@prisma/client/runtime/library"
import prisma from "@/lib/prisma"
import { success, error, handleError, requireRole, parseBody, AuthError } from "@/lib/api-utils"
import { collectCashPaymentSchema } from "@orderkaro/shared"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  try {
    const { id: canteenId, orderId } = await params
    requireRole(request, "OWNER", "MANAGER", "COUNTER")
    const body = await request.json()
    const data = parseBody(collectCashPaymentSchema, body)

    const order = await prisma.order.findFirst({
      where: { id: orderId, canteenId },
      include: { consumer: { select: { id: true, name: true } } },
    })

    if (!order) return error("Order not found", 404)
    if (order.paymentMethod !== "CASH") throw new AuthError("Order is not a cash order", 400)
    if (order.paymentStatus === "PAID") throw new AuthError("Order is already paid", 400)

    const totalAmount = new Decimal(order.totalAmount.toString())
    const amountReceived = new Decimal(data.amountReceived.toString())

    if (amountReceived.lt(totalAmount)) {
      throw new AuthError("Amount received is less than total amount", 400)
    }

    const changeAmount = amountReceived.sub(totalAmount)
    let newWalletBalance: Decimal | null = null
    let walletCredited = false

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: "PAID" },
      })

      if (changeAmount.gt(new Decimal(0))) {
        let wallet = await tx.wallet.findUnique({
          where: { consumerId: order.consumer.id },
        })

        if (!wallet) {
          wallet = await tx.wallet.create({
            data: { consumerId: order.consumer.id, balance: new Decimal(0) },
          })
        }

        const balanceBefore = new Decimal(wallet.balance.toString())
        const balanceAfter = balanceBefore.add(changeAmount)

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: balanceAfter },
        })

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "CREDIT",
            amount: changeAmount,
            balanceBefore,
            balanceAfter,
            source: "CASH_DEPOSIT",
            description: `Change from cash payment for order #${order.orderNumber}`,
            status: "APPROVED",
          },
        })

        newWalletBalance = balanceAfter
        walletCredited = true
      }
    })

    if (walletCredited && newWalletBalance === null) {
      const w = await prisma.wallet.findUnique({ where: { consumerId: order.consumer.id } })
      newWalletBalance = w ? new Decimal(w.balance.toString()) : new Decimal(0)
    }

    return success({
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderAmount: totalAmount,
      amountReceived,
      changeAmount,
      walletCredited,
      newWalletBalance,
      consumerName: order.consumer.name,
    })
  } catch (err) {
    return handleError(err)
  }
}
