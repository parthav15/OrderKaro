import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
  success,
  created,
  error,
  handleError,
  requireRole,
  parseBody,
  AuthError,
} from "@/lib/api-utils"
import { modelRequestSchema } from "@orderkaro/shared"
import { requireFeature } from "@/lib/plans"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    requireRole(request, "OWNER", "MANAGER")

    const requests = await prisma.modelRequest.findMany({
      where: { restaurantId: id },
      include: { menuItem: { select: { id: true, name: true, imageUrl: true } } },
      orderBy: { createdAt: "desc" },
    })

    return success(requests)
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    requireRole(request, "OWNER", "MANAGER")

    const restaurant = await prisma.restaurant.findUnique({ where: { id } })
    if (!restaurant) throw new AuthError("Restaurant not found", 404)

    requireFeature(restaurant, "ar")

    const body = await request.json()
    const data = parseBody(modelRequestSchema, body)

    const item = await prisma.menuItem.findFirst({
      where: { id: data.menuItemId, category: { restaurantId: id } },
      select: { id: true },
    })
    if (!item) throw new AuthError("Menu item not found", 404)

    const openRequest = await prisma.modelRequest.findFirst({
      where: {
        menuItemId: data.menuItemId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
    })
    if (openRequest) return error("A 3D model request is already open for this item", 409)

    const modelRequest = await prisma.modelRequest.create({
      data: {
        restaurantId: id,
        menuItemId: data.menuItemId,
        notes: data.notes,
      },
      include: { menuItem: { select: { id: true, name: true, imageUrl: true } } },
    })

    return created(modelRequest)
  } catch (err) {
    return handleError(err)
  }
}
