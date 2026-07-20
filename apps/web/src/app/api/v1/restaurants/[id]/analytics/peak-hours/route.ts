import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError, requireRole } from "@/lib/api-utils"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params
    requireRole(request, "OWNER", "MANAGER")

    const days = parseInt(request.nextUrl.searchParams.get("days") ?? "") || 30

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        placedAt: { gte: startDate },
        status: { notIn: ["CANCELLED", "AWAITING_PAYMENT"] },
      },
      select: { placedAt: true },
    })

    const hourCounts: number[] = new Array(24).fill(0)
    for (const order of orders) {
      hourCounts[order.placedAt.getHours()]++
    }

    const result = hourCounts.map((count, hour) => ({
      hour,
      label: `${hour.toString().padStart(2, "0")}:00`,
      orders: count,
    }))

    return success(result)
  } catch (err) {
    return handleError(err)
  }
}
