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
    if (!staff) throw new AuthError("Staff not found", 404)

    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: { isActive: !staff.isActive },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    })

    return success(updated)
  } catch (err) {
    return handleError(err)
  }
}
