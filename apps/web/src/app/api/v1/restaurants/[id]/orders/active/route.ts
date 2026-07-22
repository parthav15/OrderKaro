import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError, requireRole } from "@/lib/api-utils"
import { activeOrderWhere } from "@/lib/active-orders"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params
    requireRole(request, "KITCHEN", "COUNTER", "MANAGER", "OWNER")

    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        ...activeOrderWhere(),
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
