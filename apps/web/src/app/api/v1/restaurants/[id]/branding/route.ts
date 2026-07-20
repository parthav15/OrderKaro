import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
  success,
  handleError,
  requireRole,
  parseBody,
  AuthError,
} from "@/lib/api-utils"
import { brandingSchema } from "@orderkaro/shared"
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

    requireFeature(restaurant, "branding")

    const body = await request.json()
    const data = parseBody(brandingSchema, body)

    const updated = await prisma.restaurant.update({
      where: { id },
      data: {
        primaryColor: data.primaryColor,
        themeMode: data.themeMode,
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
      },
      select: { id: true, primaryColor: true, themeMode: true, logoUrl: true },
    })

    return success(updated)
  } catch (err) {
    return handleError(err)
  }
}
