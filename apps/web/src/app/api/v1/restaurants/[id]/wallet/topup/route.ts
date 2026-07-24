import { NextRequest } from "next/server"
import { Decimal } from "@prisma/client/runtime/library"
import prisma from "@/lib/prisma"
import {
  success,
  error,
  handleError,
  requireRole,
  parseBody,
  AuthError,
} from "@/lib/api-utils"
import { walletTopupSchema } from "@orderkaro/shared"
import { gatewayForRestaurant, currencyForCountry } from "@/lib/payments"
import { createConnectCheckout } from "@/lib/payments/stripe-connect"
import { createCashfreeSplitCheckout } from "@/lib/payments/cashfree-vendor"
import { getOrCreateWallet } from "@/lib/wallet"
import { resolveAppUrl } from "@/lib/app-url"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params
    const user = requireRole(request, "CONSUMER")

    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } })
    if (!restaurant) throw new AuthError("Restaurant not found", 404)

    const account = await prisma.restaurantPaymentAccount.findUnique({
      where: { restaurantId },
    })
    const gateway = gatewayForRestaurant(restaurant)
    const isMarketplaceStripe =
      account?.collectionMode === "MARKETPLACE" &&
      account.provider === "STRIPE" &&
      Boolean(account.stripeAccountId) &&
      account.stripeChargesEnabled
    const isMarketplaceCashfree =
      account?.collectionMode === "MARKETPLACE" &&
      account.provider === "CASHFREE" &&
      Boolean(account.cashfreeVendorId)
    const isMarketplace = isMarketplaceStripe || isMarketplaceCashfree
    if (!account || (!isMarketplace && !gateway.isReady(account))) {
      return error(`${restaurant.name} has not set up online payments yet`, 422)
    }

    const body = await request.json()
    const { amount } = parseBody(walletTopupSchema, body)

    const wallet = await getOrCreateWallet(user.id, restaurantId)
    const amountDecimal = new Decimal(amount)

    const pending = await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "CREDIT",
        amount: amountDecimal,
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance,
        source: "ONLINE",
        status: "PENDING",
        description: `Wallet top-up at ${restaurant.name}`,
      },
    })

    const appUrl = resolveAppUrl(request)
    const payer = await prisma.consumer.findUnique({
      where: { id: user.id },
      select: { name: true, phone: true },
    })

    try {
      const currency = currencyForCountry(restaurant.country)
      const returnUrl = `${appUrl}/api/v1/payments/wallet-return/${pending.id}`
      let session: { redirectUrl: string; providerOrderId: string; qrUrl?: string; upiIntent?: string }
      let providerName = gateway.provider

      if (isMarketplaceStripe) {
        providerName = "STRIPE"
        session = await createConnectCheckout({
          orderId: pending.id,
          amount,
          currency,
          applicationFee: 0,
          description: `Wallet top-up — ${restaurant.name}`,
          destinationAccountId: account.stripeAccountId!,
          successUrl: returnUrl,
          failureUrl: returnUrl,
        })
      } else if (isMarketplaceCashfree) {
        providerName = "CASHFREE"
        session = await createCashfreeSplitCheckout({
          orderId: pending.id,
          amount,
          currency,
          vendorId: account.cashfreeVendorId!,
          restaurantShare: amount,
          description: `Wallet top-up — ${restaurant.name}`,
          customerName: payer?.name ?? "Guest",
          customerPhone: payer?.phone ?? undefined,
          successUrl: returnUrl,
        })
      } else {
        session = await gateway.createCheckout(account, {
          orderId: pending.id,
          amount,
          currency,
          platformFee: 0,
          description: `Wallet top-up — ${restaurant.name}`,
          customer: { name: payer?.name ?? "Guest", phone: payer?.phone ?? undefined },
          successUrl: returnUrl,
          failureUrl: returnUrl,
        })
      }

      await prisma.walletTransaction.update({
        where: { id: pending.id },
        data: { reference: session.providerOrderId },
      })

      return success({
        provider: providerName,
        redirectUrl: session.redirectUrl,
        qrUrl: session.qrUrl ?? null,
        upiIntent: session.upiIntent ?? null,
        amount,
        currency,
        pollUrl: `/api/v1/restaurants/${restaurantId}/wallet/topup/status`,
        reference: pending.id,
        pollBody: { transactionId: pending.id },
      })
    } catch (paymentError) {
      await prisma.walletTransaction.update({
        where: { id: pending.id },
        data: { status: "REJECTED" },
      })
      throw paymentError
    }
  } catch (err) {
    return handleError(err)
  }
}
