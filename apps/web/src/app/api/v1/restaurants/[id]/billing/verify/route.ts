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
import { billingVerifySchema } from "@orderkaro/shared"
import { verifyRazorpaySignature } from "@/lib/razorpay"
import { SUBSCRIPTION_DAYS } from "@/lib/plans"

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

    const body = await request.json()
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = parseBody(
      billingVerifySchema,
      body
    )

    if (!verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      return error("Invalid payment signature", 400)
    }

    const subscription = await prisma.subscription.findFirst({
      where: { razorpayOrderId, restaurantId: id },
    })
    if (!subscription) return error("Subscription order not found", 404)

    if (subscription.status === "ACTIVE") {
      const current = await prisma.restaurant.findUnique({ where: { id } })
      return success({ plan: current!.plan, planValidUntil: current!.planValidUntil })
    }

    const now = new Date()
    const stillValid =
      restaurant.planValidUntil && restaurant.planValidUntil.getTime() > now.getTime()
    const periodStart = stillValid ? restaurant.planValidUntil! : now
    const periodEnd = new Date(
      periodStart.getTime() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000
    )

    const updated = await prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "ACTIVE",
          razorpayPaymentId,
          periodStart,
          periodEnd,
        },
      })
      return tx.restaurant.update({
        where: { id },
        data: { plan: subscription.plan, planValidUntil: periodEnd },
      })
    })

    return success({ plan: updated.plan, planValidUntil: updated.planValidUntil })
  } catch (err) {
    return handleError(err)
  }
}
