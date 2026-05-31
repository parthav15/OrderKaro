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

    const days = parseInt(request.nextUrl.searchParams.get("days") ?? "") || 30

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const items = await prisma.orderItem.groupBy({
      by: ["menuItemId"],
      where: {
        order: {
          canteenId,
          placedAt: { gte: startDate },
          status: { not: "CANCELLED" },
        },
      },
      _sum: { quantity: true, totalPrice: true },
      _count: true,
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    })

    const menuItemIds = items.map((i) => i.menuItemId)
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true, name: true, price: true, isVeg: true },
    })

    const menuItemMap = new Map(menuItems.map((m) => [m.id, m]))

    const result = items.map((item) => {
      const mi = menuItemMap.get(item.menuItemId)
      return {
        name: mi?.name || "Unknown",
        totalOrders: item._sum.quantity || 0,
        revenue: Number(item._sum.totalPrice || 0),
      }
    })

    return success(result)
  } catch (err) {
    return handleError(err)
  }
}
