import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, error, handleError, requireRole, parseBody } from "@/lib/api-utils"
import { razorpayVerifySchema } from "@orderkaro/shared"
import { verifyRazorpaySignature } from "@/lib/razorpay"

export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, "CONSUMER")
    const body = await request.json()
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = parseBody(
      razorpayVerifySchema,
      body
    )

    if (!verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      return error("Invalid payment signature", 400)
    }

    const wallet = await prisma.wallet.findUnique({ where: { consumerId: user.id } })
    if (!wallet) return error("Wallet not found", 404)

    const pending = await prisma.walletTransaction.findFirst({
      where: {
        walletId: wallet.id,
        reference: razorpayOrderId,
        source: "ONLINE",
        status: "PENDING",
      },
    })

    if (!pending) {
      const credited = await prisma.walletTransaction.findFirst({
        where: {
          walletId: wallet.id,
          reference: razorpayOrderId,
          source: "ONLINE",
          status: "APPROVED",
        },
      })
      if (credited) {
        const current = await prisma.wallet.findUnique({ where: { id: wallet.id } })
        return success({ balance: current!.balance })
      }
      return error("Recharge order not found", 404)
    }

    const result = await prisma.$transaction(async (tx) => {
      const before = await tx.wallet.findUnique({ where: { id: wallet.id } })
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: pending.amount } },
      })
      await tx.walletTransaction.update({
        where: { id: pending.id },
        data: {
          status: "APPROVED",
          balanceBefore: before!.balance,
          balanceAfter: updated.balance,
          description: `Wallet top-up via Razorpay (${razorpayPaymentId})`,
        },
      })
      return updated
    })

    return success({ balance: result.balance })
  } catch (err) {
    return handleError(err)
  }
}
