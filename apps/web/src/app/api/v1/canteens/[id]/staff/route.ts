import { NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { success, created, handleError, requireRole, parseBody, AuthError } from "@/lib/api-utils"
import { createStaffSchema } from "@orderkaro/shared"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: canteenId } = await params
    requireRole(request, "OWNER", "MANAGER")

    const staff = await prisma.staff.findMany({
      where: { id: canteenId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return success(staff)
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: canteenId } = await params
    requireRole(request, "OWNER", "MANAGER")
    const body = await request.json()
    const data = parseBody(createStaffSchema, body)

    const existing = await prisma.staff.findUnique({
      where: { canteenId_email: { canteenId, email: data.email } },
    })
    if (existing) throw new AuthError("Staff member with this email already exists", 409)

    const passwordHash = await bcrypt.hash(data.password, 12)

    const staff = await prisma.staff.create({
      data: {
        canteenId,
        email: data.email,
        passwordHash,
        pin: data.pin,
        name: data.name,
        role: data.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        pin: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return created(staff)
  } catch (err) {
    return handleError(err)
  }
}
