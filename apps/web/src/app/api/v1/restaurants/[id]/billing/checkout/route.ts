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
import { billingCheckoutSchema } from "@orderkaro/shared"
import { createRazorpayOrder, isRazorpayConfigured } from "@/lib/razorpay"
import { PLANS } from "@/lib/plans"

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

    if (!isRazorpayConfigured()) {
      return error("Payment gateway not configured", 503)
    }

    const body = await request.json()
    const { plan } = parseBody(billingCheckoutSchema, body)
    const definition = PLANS[plan]

    const razorpayOrder = await createRazorpayOrder(
      definition.monthlyPrice,
      `sub_${id.slice(0, 8)}_${plan.toLowerCase()}`
    )

    await prisma.subscription.create({
      data: {
        restaurantId: id,
        plan,
        status: "PENDING",
        amount: definition.monthlyPrice,
        razorpayOrderId: razorpayOrder.id,
      },
    })

    return success({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan: definition,
    })
  } catch (err) {
    return handleError(err)
  }
}
