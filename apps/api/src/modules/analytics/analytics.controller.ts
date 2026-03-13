import type { Request, Response } from "express"
import prisma from "../../config/database"
import { success } from "../../utils/response"

export async function getSummary(req: Request, res: Response) {
  const canteenId = req.params.canteenId as string

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [totalOrders, todayOrders, activeOrders, allOrders, todayOrdersList] =
    await Promise.all([
      prisma.order.count({
        where: { canteenId, status: { not: "CANCELLED" } },
      }),
      prisma.order.count({
        where: { canteenId, placedAt: { gte: todayStart } },
      }),
      prisma.order.count({
        where: {
          canteenId,
          status: { in: ["PLACED", "ACCEPTED", "PREPARING", "READY"] },
        },
      }),
      prisma.order.findMany({
        where: { canteenId, status: { not: "CANCELLED" } },
        select: { totalAmount: true, placedAt: true, readyAt: true },
      }),
      prisma.order.findMany({
        where: {
          canteenId,
          placedAt: { gte: todayStart },
          status: { not: "CANCELLED" },
        },
        select: { totalAmount: true },
      }),
    ])

  const totalRevenue = allOrders.reduce(
    (sum, o) => sum + Number(o.totalAmount),
    0
  )

  const todayRevenue = todayOrdersList.reduce(
    (sum, o) => sum + Number(o.totalAmount),
    0
  )

  const completedOrders = allOrders.filter((o) => o.readyAt)
  const avgPrepTimeMinutes =
    completedOrders.length > 0
      ? Math.round(
          completedOrders.reduce(
            (sum, o) =>
              sum + (o.readyAt!.getTime() - o.placedAt.getTime()) / 60000,
            0
          ) / completedOrders.length
        )
      : 0

  return success(res, {
    totalOrders,
    totalRevenue,
    avgPrepTimeMinutes,
    activeOrders,
    todayOrders,
    todayRevenue,
  })
}

export async function getRevenue(req: Request, res: Response) {
  const canteenId = req.params.canteenId as string
  const days = parseInt(req.query.days as string) || 30

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  const orders = await prisma.order.findMany({
    where: {
      canteenId,
      placedAt: { gte: startDate },
      status: { not: "CANCELLED" },
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

  return success(res, result)
}

export async function getPopularItems(req: Request, res: Response) {
  const canteenId = req.params.canteenId as string
  const days = parseInt(req.query.days as string) || 30

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

  return success(res, result)
}

export async function getPeakHours(req: Request, res: Response) {
  const canteenId = req.params.canteenId as string
  const days = parseInt(req.query.days as string) || 30

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const orders = await prisma.order.findMany({
    where: {
      canteenId,
      placedAt: { gte: startDate },
      status: { not: "CANCELLED" },
    },
    select: { placedAt: true },
  })

  const hourCounts: number[] = new Array(24).fill(0)
  for (const order of orders) {
    hourCounts[order.placedAt.getHours()]++
  }

  const result = hourCounts.map((count, hour) => ({
    hour,
    label: `${hour.toString().padStart(2, "0")}:00`,
    orders: count,
  }))

  return success(res, result)
}

export async function getCategoryRevenue(req: Request, res: Response) {
  const canteenId = req.params.canteenId as string
  const days = parseInt(req.query.days as string) || 30

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        canteenId,
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
    .map(([_, data]) => ({
      categoryName: data.name,
      revenue: data.revenue,
      orders: data.count,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  return success(res, result)
}
