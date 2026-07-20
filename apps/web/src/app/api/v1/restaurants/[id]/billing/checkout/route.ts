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
import { PLANS } from "@/lib/plans"
import { providerForCountry, gatewayFor } from "@/lib/payments"
import { platformAccount, isPlatformConfigured } from "@/lib/payments/platform"
import { resolveAppUrl } from "@/lib/app-url"

const BILLING_CURRENCY = "INR"

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

    const provider = providerForCountry(restaurant.country)
    if (!isPlatformConfigured(provider)) {
      return error(`Platform ${provider} billing is not configured`, 503)
    }

    const body = await request.json()
    const { plan } = parseBody(billingCheckoutSchema, body)
    const definition = PLANS[plan]

    const subscription = await prisma.subscription.create({
      data: {
        restaurantId: id,
        plan,
        status: "PENDING",
        amount: definition.monthlyPrice,
        currency: BILLING_CURRENCY,
        provider,
      },
    })

    const appUrl = resolveAppUrl(request)
    const returnUrl = `${appUrl}/api/v1/payments/billing-return/${subscription.id}`
    const gateway = gatewayFor(provider)

    try {
      const session = await gateway.createCheckout(platformAccount(provider), {
        orderId: subscription.id,
        amount: definition.monthlyPrice,
        currency: BILLING_CURRENCY,
        platformFee: 0,
        description: `OrderKaro ${definition.label} plan — ${restaurant.name}`,
        customer: { name: restaurant.name, phone: restaurant.phone ?? undefined },
        successUrl: returnUrl,
        failureUrl: returnUrl,
      })

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { providerOrderId: session.providerOrderId, redirectUrl: session.redirectUrl },
      })

      return success({ redirectUrl: session.redirectUrl, plan: definition })
    } catch (paymentError) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: "FAILED" },
      })
      throw paymentError
    }
  } catch (err) {
    return handleError(err)
  }
}
