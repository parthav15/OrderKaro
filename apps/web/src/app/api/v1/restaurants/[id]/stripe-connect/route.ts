import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError, requireRole, AuthError } from "@/lib/api-utils"
import { resolveAppUrl } from "@/lib/app-url"
import {
  createConnectedAccount,
  createOnboardingLink,
  fetchConnectStatus,
} from "@/lib/payments/stripe-connect"

async function ownedRestaurant(request: NextRequest, id: string) {
  const user = requireRole(request, "OWNER")
  const restaurant = await prisma.restaurant.findFirst({
    where: { id, ownerId: user.id },
    include: { owner: { select: { email: true } } },
  })
  if (!restaurant) throw new AuthError("Restaurant not found", 404)
  return restaurant
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await ownedRestaurant(request, id)
    const account = await prisma.restaurantPaymentAccount.findUnique({ where: { restaurantId: id } })
    if (!account?.stripeAccountId) {
      return success({
        connected: false,
        onboarded: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        collectionMode: account?.collectionMode ?? "BYO",
      })
    }
    const status = await fetchConnectStatus(account.stripeAccountId)
    const updated = await prisma.restaurantPaymentAccount.update({
      where: { restaurantId: id },
      data: {
        stripeChargesEnabled: status.chargesEnabled,
        stripePayoutsEnabled: status.payoutsEnabled,
        stripeDetailsSubmitted: status.detailsSubmitted,
        vendorKycStatus: status.chargesEnabled ? "VERIFIED" : "PENDING",
        collectionMode: status.chargesEnabled ? "MARKETPLACE" : undefined,
        lastCheckedAt: new Date(),
      },
    })
    return success({
      connected: true,
      onboarded: status.chargesEnabled,
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      detailsSubmitted: status.detailsSubmitted,
      collectionMode: updated.collectionMode,
    })
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const restaurant = await ownedRestaurant(request, id)
    const existing = await prisma.restaurantPaymentAccount.findUnique({ where: { restaurantId: id } })

    let accountId = existing?.stripeAccountId ?? null
    if (!accountId) {
      accountId = await createConnectedAccount({
        email: restaurant.owner?.email ?? undefined,
        country: restaurant.country || "US",
        businessName: restaurant.name,
      })
    }

    const fields = {
      provider: "STRIPE" as const,
      status: "ACTIVE" as const,
      stripeAccountId: accountId,
    }
    await prisma.restaurantPaymentAccount.upsert({
      where: { restaurantId: id },
      create: { restaurantId: id, ...fields },
      update: fields,
    })

    const base = resolveAppUrl(request)
    const onboardingUrl = await createOnboardingLink({
      accountId,
      refreshUrl: `${base}/admin/payments?stripe=refresh`,
      returnUrl: `${base}/admin/payments?stripe=return`,
    })
    return success({ onboardingUrl, accountId })
  } catch (err) {
    return handleError(err)
  }
}
