import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError, requireRole, AuthError } from "@/lib/api-utils"
import { requireFeature } from "@/lib/plans"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    requireRole(request, "OWNER", "MANAGER")

    const restaurant = await prisma.restaurant.findUnique({ where: { id } })
    if (!restaurant) throw new AuthError("Restaurant not found", 404)

    requireFeature(restaurant, "viewAnalytics")

    const days = Math.min(
      Math.max(Number(new URL(request.url).searchParams.get("days") ?? 7), 1),
      90
    )
    const since = new Date()
    since.setDate(since.getDate() - (days - 1))
    since.setHours(0, 0, 0, 0)

    const [views, itemGroups] = await Promise.all([
      prisma.menuView.findMany({
        where: { restaurantId: id, createdAt: { gte: since } },
        select: { sessionId: true, createdAt: true, menuItemId: true },
      }),
      prisma.menuView.groupBy({
        by: ["menuItemId"],
        where: { restaurantId: id, createdAt: { gte: since }, menuItemId: { not: null } },
        _count: { menuItemId: true },
        orderBy: { _count: { menuItemId: "desc" } },
        take: 10,
      }),
    ])

    const byDay = new Map<string, { views: number; sessions: Set<string> }>()
    for (let i = 0; i < days; i++) {
      const d = new Date(since)
      d.setDate(since.getDate() + i)
      byDay.set(d.toISOString().slice(0, 10), { views: 0, sessions: new Set() })
    }
    for (const view of views) {
      const key = view.createdAt.toISOString().slice(0, 10)
      const bucket = byDay.get(key)
      if (!bucket) continue
      bucket.views += 1
      bucket.sessions.add(view.sessionId)
    }

    const topItemIds = itemGroups.map((g) => g.menuItemId!).filter(Boolean)
    const topItemRecords = topItemIds.length
      ? await prisma.menuItem.findMany({
          where: { id: { in: topItemIds } },
          select: { id: true, name: true, imageUrl: true },
        })
      : []
    const nameById = new Map(topItemRecords.map((i) => [i.id, i]))

    const uniqueVisitors = new Set(views.map((v) => v.sessionId)).size

    const trackingStartedAt = views.reduce<Date | null>(
      (earliest, view) =>
        !earliest || view.createdAt < earliest ? view.createdAt : earliest,
      null
    )

    const orderCount = trackingStartedAt
      ? await prisma.order.count({
          where: { restaurantId: id, placedAt: { gte: trackingStartedAt } },
        })
      : 0

    const conversionRate =
      uniqueVisitors > 0
        ? Math.min(100, Math.round((orderCount / uniqueVisitors) * 1000) / 10)
        : 0

    return success({
      days,
      totalViews: views.length,
      uniqueVisitors,
      orders: orderCount,
      trackingStartedAt,
      conversionRate,
      timeline: Array.from(byDay.entries()).map(([date, bucket]) => ({
        date,
        views: bucket.views,
        visitors: bucket.sessions.size,
      })),
      topItems: itemGroups.map((g) => ({
        menuItemId: g.menuItemId,
        name: nameById.get(g.menuItemId!)?.name ?? "Removed item",
        imageUrl: nameById.get(g.menuItemId!)?.imageUrl ?? null,
        views: g._count.menuItemId,
      })),
    })
  } catch (err) {
    return handleError(err)
  }
}
