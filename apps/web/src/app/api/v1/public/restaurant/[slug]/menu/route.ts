import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, error, handleError } from "@/lib/api-utils"

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: params.slug },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        description: true,
        phone: true,
        isActive: true,
        openingTime: true,
        closingTime: true,
        avgPrepTime: true,
      },
    })

    if (!restaurant) {
      return error("Restaurant not found", 404)
    }

    if (!restaurant.isActive) {
      return error("Restaurant is not active", 400)
    }

    const categories = await prisma.category.findMany({
      where: {
        restaurantId: restaurant.id,
        isActive: true,
      },
      include: {
        items: {
          where: { isAvailable: true },
          include: {
            customizations: {
              include: {
                options: {
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    })

    const tables = await prisma.table.findMany({
      where: { restaurantId: restaurant.id, isActive: true },
      select: { id: true, label: true },
      orderBy: { label: "asc" },
    })

    return success({ restaurant, categories, tables })
  } catch (err) {
    return handleError(err)
  }
}
