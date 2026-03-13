import { NextRequest } from "next/server"
import { Decimal } from "@prisma/client/runtime/library"
import prisma from "@/lib/prisma"
import { created, handleError, requireRole, parseBody, AuthError } from "@/lib/api-utils"
import { creditWalletSchema } from "@orderkaro/shared"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: canteenId } = await params
    const user = requireRole(request, "OWNER", "MANAGER")
    const body = await request.json()
    const data = parseBody(creditWalletSchema, body)

    const consumer = await prisma.consumer.findUnique({ where: { id: data.consumerId } })
    if (!consumer) throw new AuthError("Consumer not found", 404)

    let wallet = await prisma.wallet.findUnique({ where: { consumerId: data.consumerId } })
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { consumerId: data.consumerId },
      })
    }

    const balanceBefore = new Decimal(wallet.balance.toString())
    const amount = new Decimal(data.amount.toString())
    const balanceAfter = balanceBefore.add(amount)

    const [updatedWallet, transaction] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "CREDIT",
          amount,
          balanceBefore,
          balanceAfter,
          source: "CASH_DEPOSIT",
          description: data.description ?? `Manual credit by staff`,
          approvedBy: user.id,
          status: "APPROVED",
        },
      }),
    ])

    return created({ wallet: updatedWallet, transaction })
  } catch (err) {
    return handleError(err)
  }
}
