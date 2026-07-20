import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError, requireRole } from "@/lib/api-utils"
import type { OrderStatus } from "@prisma/client"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params
    requireRole(request, "KITCHEN", "COUNTER", "MANAGER", "OWNER")

    const activeStatuses: OrderStatus[] = ["PLACED", "ACCEPTED", "PREPARING", "READY"]

    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        status: { in: activeStatuses },
      },
      include: {
        items: {
          include: {
            menuItem: { select: { name: true } },
          },
        },
        table: { select: { label: true } },
      },
      orderBy: { placedAt: "asc" },
    })

    return success(orders)
  } catch (err) {
    return handleError(err)
  }
}
