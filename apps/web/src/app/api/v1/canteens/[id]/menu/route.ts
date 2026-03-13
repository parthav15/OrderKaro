import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, error, handleError } from "@/lib/api-utils"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const canteen = await prisma.canteen.findUnique({ where: { id } })
    if (!canteen) return error("Canteen not found", 404)
    const categories = await prisma.category.findMany({
      where: { canteenId: id, isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: {
            customizations: {
              include: {
                options: { orderBy: { sortOrder: "asc" } },
              },
            },
          },
        },
      },
    })
    return success(categories)
  } catch (err) {
    return handleError(err)
  }
}
