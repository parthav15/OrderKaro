import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, error, handleError, requireRole } from "@/lib/api-utils"
import { confirmWalletTopup } from "@/lib/wallet"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params
    const user = requireRole(request, "CONSUMER")

    const body = (await request.json().catch(() => ({}))) as { transactionId?: string }
    if (!body.transactionId) return error("transactionId is required", 422)

    const txn = await prisma.walletTransaction.findUnique({
      where: { id: body.transactionId },
      include: { wallet: { select: { consumerId: true, restaurantId: true } } },
    })
    if (
      !txn ||
      txn.wallet.consumerId !== user.id ||
      txn.wallet.restaurantId !== restaurantId
    ) {
      return error("Top-up not found", 404)
    }

    const status = await confirmWalletTopup(txn.id)
    const wallet = await prisma.wallet.findUnique({
      where: {
        consumerId_restaurantId: { consumerId: user.id, restaurantId },
      },
      select: { balance: true },
    })

    return success({ status, balance: wallet?.balance ?? "0" })
  } catch (err) {
    return handleError(err)
  }
}
