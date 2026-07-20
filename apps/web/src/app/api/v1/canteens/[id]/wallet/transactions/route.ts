import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError, requireRole } from "@/lib/api-utils"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: canteenId } = await params
    requireRole(request, "OWNER", "MANAGER")

    const limit = Math.min(
      50,
      Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") ?? "10"))
    )

    const consumerIds = await prisma.order.findMany({
      where: { canteenId },
      select: { consumerId: true },
      distinct: ["consumerId"],
    })
    const ids = consumerIds.map((o) => o.consumerId)

    const transactions = await prisma.walletTransaction.findMany({
      where: { wallet: { consumerId: { in: ids } } },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        wallet: {
          select: { consumer: { select: { id: true, name: true, phone: true } } },
        },
      },
    })

    return success(
      transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        createdAt: t.createdAt,
        consumer: t.wallet.consumer,
      }))
    )
  } catch (err) {
    return handleError(err)
  }
}
