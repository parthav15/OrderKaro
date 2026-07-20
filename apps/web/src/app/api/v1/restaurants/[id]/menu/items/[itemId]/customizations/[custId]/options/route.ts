import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { created, handleError, requireRole, AuthError, parseBody } from "@/lib/api-utils"
import { createCustomizationOptionSchema, type CreateCustomizationOptionInput } from "@orderkaro/shared"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string; custId: string }> }
) {
  try {
    const { id: restaurantId, itemId, custId } = await params
    requireRole(request, "OWNER", "MANAGER")

    const item = await prisma.menuItem.findFirst({
      where: { id: itemId, category: { restaurantId } },
      select: { id: true },
    })
    if (!item) throw new AuthError("Menu item not found", 404)

    const customization = await prisma.customization.findFirst({
      where: { id: custId, menuItemId: itemId },
    })
    if (!customization) throw new AuthError("Customization not found", 404)

    const body = await request.json()
    const data = parseBody<CreateCustomizationOptionInput>(createCustomizationOptionSchema, body)

    const option = await prisma.customizationOption.create({
      data: {
        customizationId: custId,
        name: data.name,
        priceAdjustment: data.priceAdjustment,
        isDefault: data.isDefault,
        sortOrder: data.sortOrder,
      },
    })

    return created(option)
  } catch (err) {
    return handleError(err)
  }
}
