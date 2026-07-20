import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
  success,
  error,
  handleError,
  requireRole,
  parseBody,
  AuthError,
} from "@/lib/api-utils"
import { deliveryZoneSchema } from "@orderkaro/shared"
import { requireFeature } from "@/lib/plans"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = requireRole(request, "OWNER")
    const restaurant = await prisma.restaurant.findFirst({
      where: { id, ownerId: user.id },
    })
    if (!restaurant) throw new AuthError("Restaurant not found", 404)

    requireFeature(restaurant, "delivery")

    const body = await request.json()
    const data = parseBody(deliveryZoneSchema, body)

    if (data.deliveryEnabled && (data.latitude == null || data.longitude == null)) {
      return error("Set the restaurant location before enabling delivery", 422)
    }

    const updated = await prisma.restaurant.update({
      where: { id },
      data: {
        deliveryEnabled: data.deliveryEnabled,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        deliveryRadiusKm: data.deliveryRadiusKm,
        deliveryFee: data.deliveryFee,
        minOrderValue: data.minOrderValue,
      },
      select: {
        id: true,
        deliveryEnabled: true,
        latitude: true,
        longitude: true,
        deliveryRadiusKm: true,
        deliveryFee: true,
        minOrderValue: true,
      },
    })

    return success(updated)
  } catch (err) {
    return handleError(err)
  }
}
