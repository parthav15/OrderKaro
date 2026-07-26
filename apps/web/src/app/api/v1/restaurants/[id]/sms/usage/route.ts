import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError, requireRole, AuthError } from "@/lib/api-utils"
import { getSmsSettings } from "@/lib/sms/charge"

async function ownedRestaurant(request: NextRequest, id: string) {
  const user = requireRole(request, "OWNER")
  const restaurant = await prisma.restaurant.findFirst({ where: { id, ownerId: user.id } })
  if (!restaurant) throw new AuthError("Restaurant not found", 404)
  return restaurant
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const restaurant = await ownedRestaurant(request, id)
    const settings = await getSmsSettings()

    const pending = await prisma.smsMessage.aggregate({
      where: { restaurantId: id, billingStatus: "PENDING" },
      _count: true,
      _sum: { sellAmount: true, segments: true },
    })
    const billed = await prisma.smsMessage.aggregate({
      where: { restaurantId: id, billingStatus: "BILLED" },
      _sum: { sellAmount: true },
    })
    const totalSent = await prisma.smsMessage.count({
      where: { restaurantId: id, status: { in: ["SENT", "DELIVERED", "UNDELIVERED"] } },
    })

    return success({
      smsEnabled: restaurant.smsEnabled,
      currency: settings.currency,
      totalSent,
      pendingCount: pending._count,
      pendingSegments: pending._sum.segments ?? 0,
      pendingAmount: Number((pending._sum.sellAmount ?? 0).toString()),
      billedAmount: Number((billed._sum.sellAmount ?? 0).toString()),
    })
  } catch (err) {
    return handleError(err)
  }
}
