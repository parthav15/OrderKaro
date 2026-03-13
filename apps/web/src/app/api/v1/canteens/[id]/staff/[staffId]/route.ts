import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError, requireRole, AuthError } from "@/lib/api-utils"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; staffId: string }> }
) {
  try {
    const { id: canteenId, staffId } = await params
    requireRole(request, "OWNER", "MANAGER")

    const staff = await prisma.staff.findFirst({ where: { id: staffId, canteenId } })
    if (!staff) throw new AuthError("Staff member not found", 404)

    const body = await request.json()
    const allowedFields: Record<string, unknown> = {}
    if (typeof body.isActive === "boolean") allowedFields.isActive = body.isActive
    if (body.role && ["MANAGER", "KITCHEN", "COUNTER"].includes(body.role)) {
      allowedFields.role = body.role
    }
    if (body.name && typeof body.name === "string") allowedFields.name = body.name

    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: allowedFields,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return success(updated)
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; staffId: string }> }
) {
  try {
    const { id: canteenId, staffId } = await params
    requireRole(request, "OWNER", "MANAGER")

    const staff = await prisma.staff.findFirst({ where: { id: staffId, canteenId } })
    if (!staff) throw new AuthError("Staff member not found", 404)

    await prisma.staff.delete({ where: { id: staffId } })

    return success({ message: "Staff member deleted" })
  } catch (err) {
    return handleError(err)
  }
}
