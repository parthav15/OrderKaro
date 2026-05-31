import { NextRequest } from "next/server"
import { Decimal } from "@prisma/client/runtime/library"
import prisma from "@/lib/prisma"
import { created, error, handleError, requireRole, parseBody } from "@/lib/api-utils"
import { razorpayCreateOrderSchema } from "@orderkaro/shared"
import { createRazorpayOrder, isRazorpayConfigured } from "@/lib/razorpay"

export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, "CONSUMER")
    if (!isRazorpayConfigured()) return error("Payment gateway not configured", 503)

    const body = await request.json()
    const { amount } = parseBody(razorpayCreateOrderSchema, body)

    let wallet = await prisma.wallet.findUnique({ where: { consumerId: user.id } })
    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { consumerId: user.id } })
    }

    const order = await createRazorpayOrder(amount, `wlt_${wallet.id.slice(0, 8)}_${Date.now()}`)

    const balanceBefore = new Decimal(wallet.balance.toString())
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "CREDIT",
        amount: new Decimal(amount.toString()),
        balanceBefore,
        balanceAfter: balanceBefore,
        source: "ONLINE",
        description: "Wallet top-up via Razorpay",
        reference: order.id,
        status: "PENDING",
      },
    })

    return created({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    })
  } catch (err) {
    return handleError(err)
  }
}
