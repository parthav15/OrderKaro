import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError, requireRole } from "@/lib/api-utils"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params
    requireRole(request, "OWNER", "MANAGER")

    const consumerIds = await prisma.order.findMany({
      where: { restaurantId },
      select: { consumerId: true },
      distinct: ["consumerId"],
    })

    const ids = consumerIds.map((o) => o.consumerId)

    const consumers = await prisma.consumer.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        phone: true,
        createdAt: true,
        wallets: {
          where: { restaurantId },
          select: { balance: true },
        },
      },
      orderBy: { name: "asc" },
    })

    return success({
      consumers: consumers.map(({ wallets, ...c }) => ({
        ...c,
        wallet: { balance: wallets[0]?.balance ?? "0" },
      })),
    })
  } catch (err) {
    return handleError(err)
  }
}
