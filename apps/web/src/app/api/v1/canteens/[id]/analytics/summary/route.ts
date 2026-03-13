import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError, requireRole } from "@/lib/api-utils"
import type { OrderStatus } from "@prisma/client"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: canteenId } = await params
    requireRole(request, "OWNER", "MANAGER")

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const activeStatuses: OrderStatus[] = ["PLACED", "ACCEPTED", "PREPARING", "READY"]

    const [todayOrders, revenueResult, completedOrders, activeOrders] = await Promise.all([
      prisma.order.count({
        where: {
          canteenId,
          placedAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.order.aggregate({
        where: {
          canteenId,
          paymentStatus: "PAID",
          placedAt: { gte: todayStart, lte: todayEnd },
        },
        _sum: { totalAmount: true },
      }),
      prisma.order.findMany({
        where: {
          canteenId,
          placedAt: { gte: todayStart, lte: todayEnd },
          readyAt: { not: null },
        },
        select: { placedAt: true, readyAt: true },
      }),
      prisma.order.count({
        where: {
          canteenId,
          status: { in: activeStatuses },
        },
      }),
    ])

    let avgPrepTimeMinutes: number | null = null
    if (completedOrders.length > 0) {
      const totalMs = completedOrders.reduce((sum, o) => {
        const readyTime = o.readyAt ? new Date(o.readyAt).getTime() : 0
        const placedTime = new Date(o.placedAt).getTime()
        return sum + (readyTime - placedTime)
      }, 0)
      avgPrepTimeMinutes = Math.round(totalMs / completedOrders.length / 60_000)
    }

    return success({
      todayOrders,
      todayRevenue: revenueResult._sum.totalAmount ?? 0,
      avgPrepTimeMinutes,
      activeOrders,
    })
  } catch (err) {
    return handleError(err)
  }
}
