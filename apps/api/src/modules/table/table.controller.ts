import type { Request, Response } from "express"
import QRCode from "qrcode"
import prisma from "../../config/database"
import { success, error, created } from "../../utils/response"
import type { CreateTableInput } from "@orderkaro/shared"

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
  const tables = await prisma.table.findMany({
    where: { canteenId: req.params.canteenId as string },
    orderBy: { label: "asc" },
  })
  return success(res, tables)
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
