import type { Request, Response } from "express"
import prisma from "../../config/database"
import { success, error, created } from "../../utils/response"
import { generateAccessToken } from "../../utils/jwt"
import type { IdentifyConsumerInput } from "@orderkaro/shared"
import env from "../../config/env"

export async function resolveQr(req: Request, res: Response) {
  const qrToken = req.params.qrToken as string

  const table = await prisma.table.findUnique({
    where: { qrToken },
    include: {
      canteen: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          isActive: true,
          openingTime: true,
          closingTime: true,
        },
      },
    },
  })

  if (!table || !table.isActive) {
    return error(res, "Invalid or inactive QR code", 404)
  }

  if (!table.canteen.isActive) {
    return error(res, "This canteen is currently inactive", 400)
  }

  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

  const isOpen =
    !table.canteen.openingTime ||
    !table.canteen.closingTime ||
    (currentTime >= table.canteen.openingTime &&
      currentTime <= table.canteen.closingTime)

  const announcements = await prisma.announcement.findMany({
    where: {
      canteenId: table.canteen.id,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  })

  return success(res, {
    canteen: table.canteen,
    table: { id: table.id, label: table.label, section: table.section },
    isOpen,
    announcements,
  })
}

export async function getPublicMenu(req: Request, res: Response) {
  const slug = req.params.slug as string

  const canteen = await prisma.canteen.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, logoUrl: true, isActive: true },
  })

  if (!canteen || !canteen.isActive) {
    return error(res, "Canteen not found", 404)
  }

  const categories = await prisma.category.findMany({
    where: { canteenId: canteen.id, isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        where: { isAvailable: true },
        orderBy: { sortOrder: "asc" },
        include: {
          customizations: {
            include: { options: { orderBy: { sortOrder: "asc" } } },
          },
        },
      },
    },
  })

  return success(res, { canteen, categories })
}

export async function identifyConsumer(req: Request, res: Response) {
  const { phone, name } = req.body as IdentifyConsumerInput

  let consumer = await prisma.consumer.findUnique({
    where: { phone },
    include: { wallet: { select: { balance: true } } },
  })

  if (!consumer) {
    consumer = await prisma.consumer.create({
      data: {
        name,
        phone,
        wallet: { create: { balance: 0 } },
      },
      include: { wallet: { select: { balance: true } } },
    })
  }

  const accessToken = generateAccessToken({ id: consumer.id, role: "CONSUMER" }, "24h")

  return created(res, {
    consumer: { id: consumer.id, name: consumer.name, phone: consumer.phone },
    wallet: { balance: consumer.wallet?.balance ?? 0 },
    accessToken,
  })
}

export async function trackOrder(req: Request, res: Response) {
  const trackingToken = req.params.trackingToken as string

  const order = await prisma.order.findUnique({
    where: { trackingToken },
    include: {
      items: {
        include: {
          menuItem: { select: { name: true } },
        },
      },
      table: { select: { label: true } },
      canteen: { select: { name: true, slug: true } },
    },
  })

  if (!order) {
    return error(res, "Order not found", 404)
  }

  return success(res, {
    orderNumber: order.orderNumber,
    status: order.status,
    totalAmount: order.totalAmount,
    specialInstructions: order.specialInstructions,
    estimatedReadyAt: order.estimatedReadyAt,
    placedAt: order.placedAt,
    canteen: order.canteen,
    table: order.table,
    items: order.items.map((item) => ({
      name: item.menuItem.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      notes: item.notes,
    })),
  })
}
