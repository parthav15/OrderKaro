import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
  success,
  handleError,
  requireRole,
  parseBody,
  AuthError,
} from "@/lib/api-utils"
import { updateMenuItemSchema } from "@orderkaro/shared"

async function resolveItem(canteenId: string, itemId: string) {
  const item = await prisma.menuItem.findFirst({
    where: {
      id: itemId,
      category: { canteenId },
    },
  })
  if (!item) throw new AuthError("Menu item not found", 404)
  return item
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params
    requireRole(request, "OWNER", "MANAGER")
    await resolveItem(id, itemId)
    const body = await request.json()
    const data = parseBody(updateMenuItemSchema, body)
    const item = await prisma.menuItem.update({ where: { id: itemId }, data })
    return success(item)
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params
    requireRole(request, "OWNER", "MANAGER")
    await resolveItem(id, itemId)
    await prisma.menuItem.delete({ where: { id: itemId } })
    return success({ message: "Menu item deleted" })
  } catch (err) {
    return handleError(err)
  }
}
