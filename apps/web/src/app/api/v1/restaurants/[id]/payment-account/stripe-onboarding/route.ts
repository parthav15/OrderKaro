import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, error, handleError, requireRole, AuthError } from "@/lib/api-utils"
import { providerForCountry, gatewayFor } from "@/lib/payments"
import { isStripeConfigured } from "@/lib/payments/stripe"
import { resolveAppUrl } from "@/lib/app-url"

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

    if (providerForCountry(restaurant.country) !== "STRIPE") {
      return error("This restaurant is in a PayPur region. Connect a PayPur account instead.", 422)
    }
    if (!isStripeConfigured()) {
      return error("Stripe is not configured on the server", 503)
    }

    const gateway = gatewayFor("STRIPE")
    if (!gateway.startOnboarding) {
      return error("Stripe onboarding is unavailable", 500)
    }

    const appUrl = resolveAppUrl(request)
    const existing = await prisma.restaurantPaymentAccount.findUnique({
      where: { restaurantId: id },
    })

    const session = await gateway.startOnboarding(
      { id: restaurant.id, name: restaurant.name, country: restaurant.country },
      `${appUrl}/admin/payments?stripe=return`,
      `${appUrl}/admin/payments?stripe=refresh`
    )

    if (existing?.stripeAccountId) {
      await prisma.restaurantPaymentAccount.update({
        where: { restaurantId: id },
        data: { lastCheckedAt: new Date() },
      })
    } else {
      await prisma.restaurantPaymentAccount.upsert({
        where: { restaurantId: id },
        create: {
          restaurantId: id,
          provider: "STRIPE",
          status: "PENDING",
          stripeAccountId: session.accountRef,
        },
        update: {
          provider: "STRIPE",
          status: "PENDING",
          stripeAccountId: session.accountRef,
        },
      })
    }

    return success({ onboardingUrl: session.redirectUrl })
  } catch (err) {
    return handleError(err)
  }
}

export async function GET(
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

    const account = await prisma.restaurantPaymentAccount.findUnique({
      where: { restaurantId: id },
    })
    if (!account?.stripeAccountId) return error("No Stripe account connected", 404)

    const gateway = gatewayFor("STRIPE")
    if (!gateway.refreshAccount) return error("Stripe refresh unavailable", 500)

    const state = await gateway.refreshAccount(account.stripeAccountId)
    const updated = await prisma.restaurantPaymentAccount.update({
      where: { restaurantId: id },
      data: {
        stripeChargesEnabled: state.chargesEnabled,
        stripePayoutsEnabled: state.payoutsEnabled,
        stripeDetailsSubmitted: state.detailsSubmitted,
        status: state.chargesEnabled ? "ACTIVE" : "PENDING",
        lastCheckedAt: new Date(),
      },
      select: {
        status: true,
        stripeChargesEnabled: true,
        stripePayoutsEnabled: true,
        stripeDetailsSubmitted: true,
      },
    })

    return success(updated)
  } catch (err) {
    return handleError(err)
  }
}
