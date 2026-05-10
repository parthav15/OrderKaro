import type { Request, Response } from "express"
import QRCode from "qrcode"
import prisma from "../../config/database"
import { success, error, created } from "../../utils/response"
import type { CreateTableInput, BulkUpdatePositionsInput } from "@orderkaro/shared"

export async function createTable(req: Request, res: Response) {
  const data = req.body as CreateTableInput
  const canteenId = req.params.canteenId as string

  const existing = await prisma.table.findUnique({
    where: { canteenId_label: { canteenId, label: data.label } },
  })
  if (existing) {
    return error(res, "Table label already exists in this canteen", 409)
  }

  const table = await prisma.table.create({
    data: { ...data, canteenId },
  })

  return created(res, table)
}

export async function getTables(req: Request, res: Response) {
  const canteenId = req.params.canteenId as string
  const activeStatuses = ["PLACED", "ACCEPTED", "PREPARING", "READY"] as const

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [tables, activeGrouped, todayGrouped] = await Promise.all([
    prisma.table.findMany({
      where: { canteenId },
      orderBy: { label: "asc" },
    }),
    prisma.order.groupBy({
      by: ["tableId"],
      where: { canteenId, status: { in: [...activeStatuses] } },
      _count: { _all: true },
    }),
    prisma.order.groupBy({
      by: ["tableId"],
      where: {
        canteenId,
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

  return success(res, enriched)
}

export async function updateTable(req: Request, res: Response) {
  const table = await prisma.table.findFirst({
    where: { id: req.params.tableId as string, canteenId: req.params.canteenId as string },
  })
  if (!table) {
    return error(res, "Table not found", 404)
  }

  const updated = await prisma.table.update({
    where: { id: req.params.tableId as string },
    data: req.body,
  })
  return success(res, updated)
}

export async function deleteTable(req: Request, res: Response) {
  const table = await prisma.table.findFirst({
    where: { id: req.params.tableId as string, canteenId: req.params.canteenId as string },
  })
  if (!table) {
    return error(res, "Table not found", 404)
  }

  await prisma.table.delete({ where: { id: req.params.tableId as string } })
  return success(res, { message: "Table deleted" })
}

export async function getQrCode(req: Request, res: Response) {
  const table = await prisma.table.findFirst({
    where: { id: req.params.tableId as string, canteenId: req.params.canteenId as string },
    include: { canteen: { select: { slug: true } } },
  })
  if (!table) {
    return error(res, "Table not found", 404)
  }

  const url = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${table.canteen.slug}/menu?table=${table.qrToken}`
  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: { dark: "#0A0A0A", light: "#FFFFFF" },
  })

  return success(res, { url, qrDataUrl, table })
}

export async function bulkUpdatePositions(req: Request, res: Response) {
  const data = req.body as BulkUpdatePositionsInput
  const canteenId = req.params.canteenId as string

  const ids = data.positions.map((p) => p.id)
  const owned = await prisma.table.findMany({
    where: { id: { in: ids }, canteenId },
    select: { id: true },
  })
  const ownedIds = new Set(owned.map((t) => t.id))
  if (owned.length !== ids.length) {
    return error(res, "Some tables do not belong to this canteen", 403)
  }

  await prisma.$transaction(
    data.positions
      .filter((p) => ownedIds.has(p.id))
      .map((p) =>
        prisma.table.update({
          where: { id: p.id },
          data: { posX: p.posX, posY: p.posY },
        })
      )
  )

  return success(res, { updated: data.positions.length })
}

export async function bulkQrCodes(req: Request, res: Response) {
  const tables = await prisma.table.findMany({
    where: { canteenId: req.params.canteenId as string, isActive: true },
    include: { canteen: { select: { slug: true } } },
    orderBy: { label: "asc" },
  })

  const qrCodes = await Promise.all(
    tables.map(async (table) => {
      const url = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${table.canteen.slug}/menu?table=${table.qrToken}`
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: { dark: "#0A0A0A", light: "#FFFFFF" },
      })
      return { table: table.label, section: table.section, url, qrDataUrl }
    })
  )

  return success(res, qrCodes)
}
