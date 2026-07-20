import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, error, handleError, parseBody } from "@/lib/api-utils"
import { trackViewSchema } from "@orderkaro/shared"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    const data = parseBody(trackViewSchema, body)

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true },
    })
    if (!restaurant) return error("Restaurant not found", 404)

    if (data.menuItemId) {
      const item = await prisma.menuItem.findFirst({
        where: { id: data.menuItemId, category: { restaurantId: restaurant.id } },
        select: { id: true },
      })
      if (!item) return error("Menu item not found", 404)
    }

    await prisma.menuView.create({
      data: {
        restaurantId: restaurant.id,
        menuItemId: data.menuItemId ?? null,
        sessionId: data.sessionId,
        source: data.source,
      },
    })

    return success({ tracked: true })
  } catch (err) {
    return handleError(err)
  }
}
