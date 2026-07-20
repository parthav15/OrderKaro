import { NextRequest } from "next/server"
import { Decimal } from "@prisma/client/runtime/library"
import prisma from "@/lib/prisma"
import { success, handleError, requireRole, parseBody, AuthError } from "@/lib/api-utils"
import { approveRechargeSchema } from "@orderkaro/shared"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reqId: string }> }
) {
  try {
    const { reqId } = await params
    const user = requireRole(request, "OWNER", "MANAGER")
    const body = await request.json()
    const data = parseBody(approveRechargeSchema, body)

    const transaction = await prisma.walletTransaction.findUnique({
      where: { id: reqId },
      include: { wallet: true },
    })

    if (!transaction) throw new AuthError("Recharge request not found", 404)
    if (transaction.status !== "PENDING") throw new AuthError("Request already processed", 400)
    if (transaction.source !== "BANK_TRANSFER") throw new AuthError("Not a recharge request", 400)

    if (data.status === "REJECTED") {
      await prisma.walletTransaction.update({
        where: { id: reqId },
        data: {
          status: "REJECTED",
          approvedBy: user.id,
          description: data.note
            ? `Rejected: ${data.note}`
            : transaction.description,
        },
      })
      return success({ message: "Recharge request rejected" })
    }

    const wallet = transaction.wallet
    const balanceBefore = new Decimal(wallet.balance.toString())
    const amount = new Decimal(transaction.amount.toString())
    const balanceAfter = balanceBefore.add(amount)

    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      }),
      prisma.walletTransaction.update({
        where: { id: reqId },
        data: {
          status: "APPROVED",
          balanceBefore,
          balanceAfter,
          approvedBy: user.id,
          description: data.note
            ? `Approved: ${data.note}`
            : transaction.description,
        },
      }),
    ])

    return success({ message: "Recharge request approved", newBalance: balanceAfter })
  } catch (err) {
    return handleError(err)
  }
}
