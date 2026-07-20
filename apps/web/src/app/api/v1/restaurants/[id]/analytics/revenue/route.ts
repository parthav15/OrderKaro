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
    startDate.setHours(0, 0, 0, 0)

    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        placedAt: { gte: startDate },
        status: { notIn: ["CANCELLED", "AWAITING_PAYMENT"] },
      },
      select: { totalAmount: true, placedAt: true },
    })

    const revenueByDay: Record<string, { revenue: number; orders: number }> = {}
    for (let i = 0; i < days; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      revenueByDay[d.toISOString().split("T")[0]] = { revenue: 0, orders: 0 }
    }

    for (const order of orders) {
      const day = order.placedAt.toISOString().split("T")[0]
      if (revenueByDay[day] !== undefined) {
        revenueByDay[day].revenue += Number(order.totalAmount)
        revenueByDay[day].orders += 1
      }
    }

    const result = Object.entries(revenueByDay)
      .map(([date, data]) => ({ date, revenue: data.revenue, orders: data.orders }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return success(result)
  } catch (err) {
    return handleError(err)
  }
}
