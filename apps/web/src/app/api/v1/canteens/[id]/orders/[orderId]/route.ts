import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, error, handleError, requireAuth, AuthError } from "@/lib/api-utils"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  try {
    const { id: canteenId, orderId } = await params
    const user = requireAuth(request)

    const order = await prisma.order.findFirst({
      where: { id: orderId, canteenId },
      include: {
        items: {
          include: {
            menuItem: { select: { name: true } },
          },
        },
        table: { select: { label: true, section: true } },
        statusLogs: { orderBy: { createdAt: "asc" } },
      },
    })

    if (!order) return error("Order not found", 404)

    if (user.role === "CONSUMER" && order.consumerId !== user.id) {
      throw new AuthError("Access denied", 403)
    }

    return success(order)
  } catch (err) {
    return handleError(err)
  }
}
