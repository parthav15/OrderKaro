import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
  success,
  created,
  handleError,
  requireRole,
  parseBody,
  AuthError,
} from "@/lib/api-utils"
import { createTableSchema } from "@orderkaro/shared"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    requireRole(request, "OWNER", "MANAGER")

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [tables, activeGrouped, todayGrouped] = await Promise.all([
      prisma.table.findMany({
        where: { restaurantId: id },
        orderBy: { label: "asc" },
      }),
      prisma.order.groupBy({
        by: ["tableId"],
        where: {
          restaurantId: id,
          status: { in: ["PLACED", "ACCEPTED", "PREPARING", "READY"] },
        },
        _count: { _all: true },
      }),
      prisma.order.groupBy({
        by: ["tableId"],
        where: {
          restaurantId: id,
          placedAt: { gte: todayStart },
          status: { not: "CANCELLED" },
        },
        _count: { _all: true },
      }),
    ])

    const activeMap = new Map(activeGrouped.map((g) => [g.tableId, g._count._all]))
    const todayMap = new Map(todayGrouped.map((g) => [g.tableId, g._count._all]))

    const enriched = tables.map((t) => ({
      ...t,
      activeOrderCount: activeMap.get(t.id) ?? 0,
      todayOrderCount: todayMap.get(t.id) ?? 0,
    }))

    return success(enriched)
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    requireRole(request, "OWNER", "MANAGER")
    const restaurant = await prisma.restaurant.findUnique({ where: { id } })
    if (!restaurant) throw new AuthError("Restaurant not found", 404)
    const body = await request.json()
    const data = parseBody(createTableSchema, body)
    const table = await prisma.table.create({
      data: { ...data, restaurantId: id },
    })
    return created(table)
  } catch (err) {
    return handleError(err)
  }
}
