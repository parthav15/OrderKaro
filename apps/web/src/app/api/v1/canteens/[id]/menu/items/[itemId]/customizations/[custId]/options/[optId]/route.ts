import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError, requireRole, AuthError, parseBody } from "@/lib/api-utils"
import { updateCustomizationOptionSchema, type UpdateCustomizationOptionInput } from "@orderkaro/shared"

async function resolveOption(canteenId: string, itemId: string, custId: string, optId: string) {
  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, category: { canteenId } },
    select: { id: true },
  })
  if (!item) throw new AuthError("Menu item not found", 404)

  const option = await prisma.customizationOption.findFirst({
    where: { id: optId, customizationId: custId, customization: { menuItemId: itemId } },
  })
  if (!option) throw new AuthError("Option not found", 404)
  return option
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string; custId: string; optId: string }> }
) {
  try {
    const { id: canteenId, itemId, custId, optId } = await params
    requireRole(request, "OWNER", "MANAGER")
    await resolveOption(canteenId, itemId, custId, optId)

    const body = await request.json()
    const data = parseBody<UpdateCustomizationOptionInput>(updateCustomizationOptionSchema, body)

    const updated = await prisma.customizationOption.update({
      where: { id: optId },
      data,
    })

    return success(updated)
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string; custId: string; optId: string }> }
) {
  try {
    const { id: canteenId, itemId, custId, optId } = await params
    requireRole(request, "OWNER", "MANAGER")
    await resolveOption(canteenId, itemId, custId, optId)

    await prisma.customizationOption.delete({ where: { id: optId } })

    return success({ message: "Option deleted" })
  } catch (err) {
    return handleError(err)
  }
}
