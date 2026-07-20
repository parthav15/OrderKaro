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
import { updateRestaurantSchema } from "@orderkaro/shared"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = requireRole(request, "OWNER")
    const restaurant = await prisma.restaurant.findFirst({
      where: { id, ownerId: user.id },
      include: {
        categories: { orderBy: { sortOrder: "asc" } },
        tables: { orderBy: { label: "asc" } },
        _count: { select: { staff: true } },
      },
    })
    if (!restaurant) return error("Restaurant not found", 404)
    return success(restaurant)
  } catch (err) {
    return handleError(err)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = requireRole(request, "OWNER")
    const existing = await prisma.restaurant.findFirst({
      where: { id, ownerId: user.id },
    })
    if (!existing) throw new AuthError("Restaurant not found", 404)
    const body = await request.json()
    const data = parseBody(updateRestaurantSchema, body)
    const restaurant = await prisma.restaurant.update({ where: { id }, data })
    return success(restaurant)
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = requireRole(request, "OWNER")
    const existing = await prisma.restaurant.findFirst({
      where: { id, ownerId: user.id },
    })
    if (!existing) throw new AuthError("Restaurant not found", 404)
    await prisma.restaurant.delete({ where: { id } })
    return success({ message: "Restaurant deleted" })
  } catch (err) {
    return handleError(err)
  }
}
