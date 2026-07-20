import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
  success,
  handleError,
  requireRole,
  parseBody,
  AuthError,
} from "@/lib/api-utils"
import { bulkUpdatePositionsSchema } from "@orderkaro/shared"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    requireRole(request, "OWNER", "MANAGER")
    const body = await request.json()
    const data = parseBody(bulkUpdatePositionsSchema, body)

    const ids = data.positions.map((p) => p.id)
    const owned = await prisma.table.findMany({
      where: { id: { in: ids }, restaurantId: id },
      select: { id: true },
    })
    const ownedIds = new Set(owned.map((t) => t.id))
    if (owned.length !== ids.length) {
      throw new AuthError("Some tables do not belong to this restaurant", 403)
    }

    await prisma.$transaction(
      data.positions
        .filter((p) => ownedIds.has(p.id))
        .map((p) =>
          prisma.table.update({
            where: { id: p.id },
            data: { posX: p.posX, posY: p.posY },
          })
        )
    )

    return success({ updated: data.positions.length })
  } catch (err) {
    return handleError(err)
  }
}
