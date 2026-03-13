import type { Request, Response } from "express"
import prisma from "../../config/database"
import { success, error, created } from "../../utils/response"
import type { CreateCanteenInput, UpdateCanteenInput } from "@orderkaro/shared"

export async function createCanteen(req: Request, res: Response) {
  const data = req.body as CreateCanteenInput
  const ownerId = req.user!.id

  const existing = await prisma.canteen.findUnique({
    where: { slug: data.slug },
  })
  if (existing) {
    return error(res, "Slug already taken", 409)
  }

  const canteen = await prisma.canteen.create({
    data: { ...data, ownerId },
  })

  return created(res, canteen)
}

export async function getCanteens(req: Request, res: Response) {
  const canteens = await prisma.canteen.findMany({
    where: { ownerId: req.user!.id },
    orderBy: { createdAt: "desc" },
  })
  return success(res, canteens)
}

export async function getCanteen(req: Request, res: Response) {
  const canteen = await prisma.canteen.findFirst({
    where: { id: req.params.id as string, ownerId: req.user!.id },
    include: {
      _count: {
        select: { categories: true, tables: true, orders: true, staff: true },
      },
    },
  })
  if (!canteen) {
    return error(res, "Canteen not found", 404)
  }
  return success(res, canteen)
}

export async function updateCanteen(req: Request, res: Response) {
  const data = req.body as UpdateCanteenInput

  const canteen = await prisma.canteen.findFirst({
    where: { id: req.params.id as string, ownerId: req.user!.id },
  })
  if (!canteen) {
    return error(res, "Canteen not found", 404)
  }

  if (data.slug && data.slug !== canteen.slug) {
    const slugTaken = await prisma.canteen.findUnique({
      where: { slug: data.slug },
    })
    if (slugTaken) {
      return error(res, "Slug already taken", 409)
    }
  }

  const updated = await prisma.canteen.update({
    where: { id: req.params.id as string },
    data,
  })

  return success(res, updated)
}

export async function deleteCanteen(req: Request, res: Response) {
  const canteen = await prisma.canteen.findFirst({
    where: { id: req.params.id as string, ownerId: req.user!.id },
  })
  if (!canteen) {
    return error(res, "Canteen not found", 404)
  }

  await prisma.canteen.delete({ where: { id: req.params.id as string } })
  return success(res, { message: "Canteen deleted" })
}
