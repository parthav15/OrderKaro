import type { Request, Response } from "express"
import prisma from "../../config/database"
import { hashPassword } from "../../utils/password"
import { success, error, created } from "../../utils/response"
import type { CreateStaffInput, UpdateStaffInput } from "@orderkaro/shared"

export async function createStaff(req: Request, res: Response) {
  const data = req.body as CreateStaffInput
  const canteenId = req.params.canteenId as string

  const existing = await prisma.staff.findUnique({
    where: { canteenId_email: { canteenId, email: data.email } },
  })
  if (existing) {
    return error(res, "Staff with this email already exists in this canteen", 409)
  }

  const passwordHash = await hashPassword(data.password)

  const staff = await prisma.staff.create({
    data: {
      canteenId,
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role,
      pin: data.pin,
    },
    select: { id: true, name: true, email: true, role: true, pin: true, isActive: true, createdAt: true },
  })

  return created(res, staff)
}

export async function getStaff(req: Request, res: Response) {
  const staff = await prisma.staff.findMany({
    where: { canteenId: req.params.canteenId as string },
    select: { id: true, name: true, email: true, role: true, pin: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })
  return success(res, staff)
}

export async function updateStaff(req: Request, res: Response) {
  const data = req.body as UpdateStaffInput
  const staffId = req.params.staffId as string
  const canteenId = req.params.canteenId as string

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, canteenId },
  })
  if (!staff) {
    return error(res, "Staff not found", 404)
  }

  const updated = await prisma.staff.update({
    where: { id: staffId },
    data,
    select: { id: true, name: true, email: true, role: true, pin: true, isActive: true, createdAt: true },
  })

  return success(res, updated)
}

export async function deleteStaff(req: Request, res: Response) {
  const staffId = req.params.staffId as string
  const canteenId = req.params.canteenId as string

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, canteenId },
  })
  if (!staff) {
    return error(res, "Staff not found", 404)
  }

  await prisma.staff.delete({
    where: { id: staffId },
  })

  return success(res, { message: "Staff deleted" })
}

export async function toggleStaff(req: Request, res: Response) {
  const staffId = req.params.staffId as string
  const canteenId = req.params.canteenId as string

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, canteenId },
  })
  if (!staff) {
    return error(res, "Staff not found", 404)
  }

  const updated = await prisma.staff.update({
    where: { id: staffId },
    data: { isActive: !staff.isActive },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  })

  return success(res, updated)
}
