import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
  success,
  created,
  handleError,
  requireRole,
  parseBody,
} from "@/lib/api-utils"
import { createRestaurantSchema } from "@orderkaro/shared"

export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, "OWNER")
    const restaurants = await prisma.restaurant.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
    })
    return success(restaurants)
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, "OWNER")
    const body = await request.json()
    const data = parseBody(createRestaurantSchema, body)
    const restaurant = await prisma.restaurant.create({
      data: { ...data, ownerId: user.id },
    })
    return created(restaurant)
  } catch (err) {
    return handleError(err)
  }
}
