import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, error, handleError } from "@/lib/api-utils"
import { distanceInKm, roundKm } from "@/lib/geo"
import { isDeliveryFeeExempt } from "@/lib/delivery-exemptions"

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const body = await request.json().catch(() => ({}))
    const latitude = Number(body?.latitude)
    const longitude = Number(body?.longitude)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return error("A valid location is required", 400)
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: params.slug },
      select: {
        id: true,
        deliveryEnabled: true,
        latitude: true,
        longitude: true,
        deliveryRadiusKm: true,
      },
    })
    if (!restaurant) return error("Restaurant not found", 404)

    const feeExempt = await isDeliveryFeeExempt(restaurant.id, body?.phone)

    const enforced =
      restaurant.deliveryEnabled && restaurant.latitude != null && restaurant.longitude != null

    if (!enforced) {
      return success({ enforced: false, deliverable: true, distanceKm: null, radiusKm: restaurant.deliveryRadiusKm, feeExempt })
    }

    const distanceKm = roundKm(
      distanceInKm(restaurant.latitude!, restaurant.longitude!, latitude, longitude)
    )
    return success({
      enforced: true,
      deliverable: distanceKm <= restaurant.deliveryRadiusKm,
      distanceKm,
      radiusKm: restaurant.deliveryRadiusKm,
      feeExempt,
    })
  } catch (err) {
    return handleError(err)
  }
}
