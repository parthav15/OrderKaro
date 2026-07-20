import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, error, handleError, requireRole, AuthError } from "@/lib/api-utils"
import { confirmSubscriptionPayment } from "@/lib/payments/confirm-billing"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = requireRole(request, "OWNER")
    const restaurant = await prisma.restaurant.findFirst({
      where: { id, ownerId: user.id },
    })
    if (!restaurant) throw new AuthError("Restaurant not found", 404)

    const body = (await request.json().catch(() => ({}))) as { subscriptionId?: string }
    const subscription = body.subscriptionId
      ? await prisma.subscription.findFirst({
          where: { id: body.subscriptionId, restaurantId: id },
        })
      : await prisma.subscription.findFirst({
          where: { restaurantId: id, status: "PENDING" },
          orderBy: { createdAt: "desc" },
        })

    if (!subscription) return error("No pending subscription to verify", 404)

    const outcome = await confirmSubscriptionPayment(subscription.id)
    const updated = await prisma.restaurant.findUnique({
      where: { id },
      select: { plan: true, planValidUntil: true },
    })

    return success({ outcome, plan: updated!.plan, planValidUntil: updated!.planValidUntil })
  } catch (err) {
    return handleError(err)
  }
}
