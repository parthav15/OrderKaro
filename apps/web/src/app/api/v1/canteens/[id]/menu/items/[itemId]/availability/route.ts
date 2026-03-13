import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
  success,
  handleError,
  requireRole,
  AuthError,
} from "@/lib/api-utils"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params
    requireRole(request, "OWNER", "MANAGER", "KITCHEN")
    const item = await prisma.menuItem.findFirst({
      where: { id: itemId, category: { canteenId: id } },
    })
    if (!item) throw new AuthError("Menu item not found", 404)
    const updated = await prisma.menuItem.update({
      where: { id: itemId },
      data: { isAvailable: !item.isAvailable },
    })
    return success(updated)
  } catch (err) {
    return handleError(err)
  }
}
