import type { Request, Response } from "express"
import prisma from "../../config/database"
import { success, error } from "../../utils/response"

export async function listOwners(req: Request, res: Response) {
  const owners = await prisma.owner.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isVerified: true,
      createdAt: true,
      canteens: {
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return success(res, owners)
}

export async function toggleOwnerVerification(req: Request, res: Response) {
  const id = req.params.id as string

  const owner = await prisma.owner.findUnique({ where: { id } })
  if (!owner) {
    return error(res, "Owner not found", 404)
  }

  const updated = await prisma.owner.update({
    where: { id },
    data: { isVerified: !owner.isVerified },
    select: {
      id: true,
      name: true,
      email: true,
      isVerified: true,
    },
  })

  return success(res, updated)
}

export async function getSystemStats(req: Request, res: Response) {
  const [totalOwners, totalCanteens, activeCanteens, totalOrders, revenueAgg] =
    await Promise.all([
      prisma.owner.count(),
      prisma.canteen.count(),
      prisma.canteen.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: "PAID" },
      }),
    ])

  return success(res, {
    totalOwners,
    totalCanteens,
    activeCanteens,
    totalOrders,
    totalRevenue: revenueAgg._sum.totalAmount ?? 0,
  })
}
