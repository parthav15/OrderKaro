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

    const days = parseInt(request.nextUrl.searchParams.get("days") ?? "") || 30

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          restaurantId,
          placedAt: { gte: startDate },
          status: { not: "CANCELLED" },
        },
      },
      include: {
        menuItem: {
          include: { category: { select: { id: true, name: true } } },
        },
      },
    })

    const categoryMap: Record<string, { name: string; revenue: number; count: number }> = {}

    for (const item of orderItems) {
      const catId = item.menuItem.category.id
      if (!categoryMap[catId]) {
        categoryMap[catId] = { name: item.menuItem.category.name, revenue: 0, count: 0 }
      }
      categoryMap[catId].revenue += Number(item.totalPrice)
      categoryMap[catId].count += item.quantity
    }

    const result = Object.entries(categoryMap)
      .map(([, data]) => ({
        categoryName: data.name,
        revenue: data.revenue,
        orders: data.count,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    return success(result)
  } catch (err) {
    return handleError(err)
  }
}
