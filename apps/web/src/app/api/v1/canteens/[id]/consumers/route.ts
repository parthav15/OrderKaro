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

    const consumerIds = await prisma.order.findMany({
      where: { id: canteenId },
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
        wallet: {
          select: { balance: true },
        },
      },
      orderBy: { name: "asc" },
    })

    return success(consumers)
  } catch (err) {
    return handleError(err)
  }
}
