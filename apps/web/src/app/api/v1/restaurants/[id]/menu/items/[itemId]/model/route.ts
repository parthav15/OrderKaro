import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
  success,
  handleError,
  requireRole,
  parseBody,
  AuthError,
} from "@/lib/api-utils"
import { menuItemModelSchema } from "@orderkaro/shared"
import { requireFeature } from "@/lib/plans"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params
    requireRole(request, "OWNER", "MANAGER")

    const restaurant = await prisma.restaurant.findUnique({ where: { id } })
    if (!restaurant) throw new AuthError("Restaurant not found", 404)

    requireFeature(restaurant, "ar")

    const item = await prisma.menuItem.findFirst({
      where: { id: itemId, category: { restaurantId: id } },
      select: { id: true },
    })
    if (!item) throw new AuthError("Menu item not found", 404)

    const body = await request.json()
    const data = parseBody(menuItemModelSchema, body)

    const updated = await prisma.menuItem.update({
      where: { id: itemId },
      data: {
        model3dUrl: data.model3dUrl,
        model3dUsdzUrl: data.model3dUsdzUrl ?? null,
        model3dPosterUrl: data.model3dPosterUrl ?? null,
      },
      select: {
        id: true,
        name: true,
        model3dUrl: true,
        model3dUsdzUrl: true,
        model3dPosterUrl: true,
      },
    })

    return success(updated)
  } catch (err) {
    return handleError(err)
  }
}
