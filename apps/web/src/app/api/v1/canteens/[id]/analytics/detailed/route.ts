import { NextRequest } from "next/server"
import { Decimal } from "@prisma/client/runtime/library"
import prisma from "@/lib/prisma"
import { success, handleError, requireRole, AuthError } from "@/lib/api-utils"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: canteenId } = await params
    requireRole(request, "OWNER", "MANAGER")

    const periodParam = request.nextUrl.searchParams.get("period") ?? "7d"
    const periodDays: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 }
    const days = periodDays[periodParam]
    if (!days) throw new AuthError("Invalid period. Use 7d, 30d, or 90d", 400)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const [allOrders, orderItemsRaw, ordersByStatusRaw] = await Promise.all([
      prisma.order.findMany({
        where: {
          canteenId,
          placedAt: { gte: startDate },
          paymentStatus: "PAID",
        },
        select: { placedAt: true, totalAmount: true },
      }),
      prisma.orderItem.findMany({
        where: {
          order: {
            canteenId,
            placedAt: { gte: startDate },
          },
        },
        include: {
          menuItem: { select: { name: true } },
        },
      }),
      prisma.order.groupBy({
        by: ["status"],
        where: {
          canteenId,
          placedAt: { gte: startDate },
        },
        _count: { id: true },
      }),
    ])

    const revenueMap = new Map<string, Decimal>()
    for (const order of allOrders) {
      const dateKey = new Date(order.placedAt).toISOString().split("T")[0]
      const existing = revenueMap.get(dateKey) ?? new Decimal(0)
      revenueMap.set(dateKey, existing.add(new Decimal(order.totalAmount.toString())))
    }

    const revenueByDay = Array.from(revenueMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const itemCountMap = new Map<string, { name: string; count: number; menuItemId: string }>()
    for (const item of orderItemsRaw) {
      const existing = itemCountMap.get(item.menuItemId)
      if (existing) {
        existing.count += item.quantity
      } else {
        itemCountMap.set(item.menuItemId, {
          menuItemId: item.menuItemId,
          name: item.menuItem.name,
          count: item.quantity,
        })
      }
    }

    const topItems = Array.from(itemCountMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const ordersByStatus = ordersByStatusRaw.map((r) => ({
      status: r.status,
      count: r._count.id,
    }))

    const peakHoursMap = new Map<number, number>()
    const allOrdersForHours = await prisma.order.findMany({
      where: { id: canteenId, placedAt: { gte: startDate } },
      select: { placedAt: true },
    })
    for (const order of allOrdersForHours) {
      const hour = new Date(order.placedAt).getHours()
      peakHoursMap.set(hour, (peakHoursMap.get(hour) ?? 0) + 1)
    }

    const peakHours = Array.from(peakHoursMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour - b.hour)

    return success({ revenueByDay, topItems, ordersByStatus, peakHours })
  } catch (err) {
    return handleError(err)
  }
}
