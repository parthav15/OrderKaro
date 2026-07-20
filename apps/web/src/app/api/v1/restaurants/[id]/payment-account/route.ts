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
import { connectPaypurSchema, connectStripeSchema } from "@orderkaro/shared"
import { encryptSecret, isCredentialStoreConfigured, maskSecret } from "@/lib/secure-store"
import { providerForCountry, currencyForCountry, gatewayFor } from "@/lib/payments"
import { verifyStripeKey } from "@/lib/payments/stripe"

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
    const provider = providerForCountry(restaurant.country)
    const gateway = gatewayFor(provider)

    return success({
      country: restaurant.country,
      currency: currencyForCountry(restaurant.country),
      provider,
      commissionPercent: restaurant.commissionPercent,
      capabilities: {
        hostedOnboarding: gateway.supportsHostedOnboarding,
        platformFee: gateway.supportsPlatformFee,
        webhooks: gateway.supportsWebhooks,
        refunds: gateway.supportsRefunds,
      },
      connected: gateway.isReady(account),
      status: account?.status ?? "PENDING",
      paypurKeyPreview: account?.paypurKeyCipher ? maskSecret(account.paypurKeyCipher) : null,
      stripeKeyPreview: account?.stripeKeyCipher ? maskSecret(account.stripeKeyCipher) : null,
    })
  } catch (err) {
    return handleError(err)
  }
}

export async function PUT(
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

    if (!isCredentialStoreConfigured()) {
      return error("Credential encryption is not configured on the server", 503)
    }

    const provider = providerForCountry(restaurant.country)
    const body = await request.json()

    if (provider === "STRIPE") {
      const data = parseBody(connectStripeSchema, body)
      if (!(await verifyStripeKey(data.secretKey))) {
        return error("That Stripe secret key is not valid", 422)
      }
      const account = await prisma.restaurantPaymentAccount.upsert({
        where: { restaurantId: id },
        create: {
          restaurantId: id,
          provider: "STRIPE",
          status: "ACTIVE",
          stripeKeyCipher: encryptSecret(data.secretKey),
        },
        update: {
          provider: "STRIPE",
          status: "ACTIVE",
          stripeKeyCipher: encryptSecret(data.secretKey),
        },
        select: { id: true, status: true, provider: true },
      })
      return success(account)
    }

    const data = parseBody(connectPaypurSchema, body)
    const account = await prisma.restaurantPaymentAccount.upsert({
      where: { restaurantId: id },
      create: {
        restaurantId: id,
        provider: "PAYPUR",
        status: "ACTIVE",
        paypurKeyCipher: encryptSecret(data.apiKey),
        paypurSaltCipher: encryptSecret(data.signingSecret),
      },
      update: {
        provider: "PAYPUR",
        status: "ACTIVE",
        paypurKeyCipher: encryptSecret(data.apiKey),
        paypurSaltCipher: encryptSecret(data.signingSecret),
      },
      select: { id: true, status: true, provider: true },
    })

    return success(account)
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(
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

    await prisma.restaurantPaymentAccount.deleteMany({ where: { restaurantId: id } })
    return success({ disconnected: true })
  } catch (err) {
    return handleError(err)
  }
}
