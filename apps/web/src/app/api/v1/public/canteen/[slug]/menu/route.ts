import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, error, handleError } from "@/lib/api-utils"

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const canteen = await prisma.canteen.findUnique({
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

    if (!canteen) {
      return error("Canteen not found", 404)
    }

    if (!canteen.isActive) {
      return error("Canteen is not active", 400)
    }

    const categories = await prisma.category.findMany({
      where: {
        canteenId: canteen.id,
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

    return success({ canteen, categories })
  } catch (err) {
    return handleError(err)
  }
}
