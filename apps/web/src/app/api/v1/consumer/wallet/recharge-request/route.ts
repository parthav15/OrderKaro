import { NextRequest } from "next/server"
import { Decimal } from "@prisma/client/runtime/library"
import prisma from "@/lib/prisma"
import { created, handleError, requireRole, parseBody, AuthError } from "@/lib/api-utils"
import { rechargeRequestSchema } from "@orderkaro/shared"

export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, "CONSUMER")
    const body = await request.json()
    const data = parseBody(rechargeRequestSchema, body)

    let wallet = await prisma.wallet.findUnique({ where: { consumerId: user.id } })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { consumerId: user.id },
      })
    }

    const balanceBefore = new Decimal(wallet.balance.toString())
    const amount = new Decimal(data.amount.toString())

    const transaction = await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "CREDIT",
        amount,
        balanceBefore,
        balanceAfter: balanceBefore,
        source: "BANK_TRANSFER",
        description: data.description,
        reference: data.reference,
        status: "PENDING",
      },
    })

    return created(transaction)
  } catch (err) {
    return handleError(err)
  }
}
