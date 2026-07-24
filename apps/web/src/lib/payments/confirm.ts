import { Decimal } from "@prisma/client/runtime/library"
import prisma from "@/lib/prisma"
import { gatewayFor } from "@/lib/payments"
import { fetchConnectCheckoutStatus } from "@/lib/payments/stripe-connect"

export type ConfirmOutcome = "PAID" | "PENDING" | "FAILED" | "UNKNOWN"

export async function confirmOrderPayment(orderId: string): Promise<ConfirmOutcome> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { restaurant: { select: { id: true, country: true } } },
  })

  if (!order || !order.paymentProvider || !order.paymentOrderId) return "UNKNOWN"
  if (order.paymentStatus === "PAID") return "PAID"

  const account = await prisma.restaurantPaymentAccount.findUnique({
    where: { restaurantId: order.restaurantId },
  })
  if (!account) return "UNKNOWN"

  const isMarketplaceStripe =
    order.paymentProvider === "STRIPE" &&
    account.collectionMode === "MARKETPLACE" &&
    Boolean(account.stripeAccountId)
  const result = isMarketplaceStripe
    ? await fetchConnectCheckoutStatus(order.paymentOrderId)
    : await gatewayFor(order.paymentProvider).fetchStatus(
        account,
        order.paymentOrderId,
        order.paymentTxnId
      )

  if (result.paid) {
    const expected = new Decimal(order.totalAmount.toString())
    const received = result.amount != null ? new Decimal(result.amount) : null

    if (received && received.lessThan(expected.mul(new Decimal("0.99")))) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentTxnId: result.providerTxnId,
          statusLogs: {
            create: {
              fromStatus: order.status,
              toStatus: order.status,
              note: `Underpaid: expected ${expected.toFixed(2)}, received ${received.toFixed(2)}`,
            },
          },
        },
      })
      return "PENDING"
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        paidAt: new Date(),
        paymentTxnId: result.providerTxnId,
        ...(isMarketplaceStripe && { settlementStatus: "SETTLED" as const }),
        ...(order.status === "AWAITING_PAYMENT" && {
          status: "PLACED",
          statusLogs: {
            create: {
              fromStatus: "AWAITING_PAYMENT",
              toStatus: "PLACED",
              note: "Online payment confirmed",
            },
          },
        }),
      },
    })
    return "PAID"
  }

  if (result.failed) {
    if (order.status === "AWAITING_PAYMENT") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          statusLogs: {
            create: {
              fromStatus: "AWAITING_PAYMENT",
              toStatus: "CANCELLED",
              note: "Online payment failed or expired",
            },
          },
        },
      })
    }
    return "FAILED"
  }

  return "PENDING"
}

export async function reconcilePendingPayments(restaurantId?: string): Promise<{
  checked: number
  confirmed: number
}> {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000)
  const pending = await prisma.order.findMany({
    where: {
      status: "AWAITING_PAYMENT",
      paymentOrderId: { not: null },
      placedAt: { gte: cutoff },
      ...(restaurantId && { restaurantId }),
    },
    select: { id: true },
    take: 50,
  })

  let confirmed = 0
  for (const order of pending) {
    const outcome = await confirmOrderPayment(order.id).catch(() => "UNKNOWN" as ConfirmOutcome)
    if (outcome === "PAID") confirmed += 1
  }

  return { checked: pending.length, confirmed }
}
