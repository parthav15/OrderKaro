import { Decimal } from "@prisma/client/runtime/library"
import prisma from "@/lib/prisma"
import { gatewayFor } from "@/lib/payments"
import { fetchConnectCheckoutStatus } from "@/lib/payments/stripe-connect"
import { fetchCashfreeSplitStatus } from "@/lib/payments/cashfree-vendor"
import { dispatchSms } from "@/lib/sms/dispatch"
import { SMS_RESTAURANT_SELECT } from "@/lib/sms/templates"

export type ConfirmOutcome = "PAID" | "PENDING" | "FAILED" | "UNKNOWN"

export async function confirmOrderPayment(orderId: string): Promise<ConfirmOutcome> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { restaurant: { select: { ...SMS_RESTAURANT_SELECT, country: true, ownerId: true } } },
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
  const isMarketplaceCashfree =
    order.paymentProvider === "CASHFREE" &&
    account.collectionMode === "MARKETPLACE" &&
    Boolean(account.cashfreeVendorId)
  const isMarketplace = isMarketplaceStripe || isMarketplaceCashfree
  const result = isMarketplaceStripe
    ? await fetchConnectCheckoutStatus(order.paymentOrderId)
    : isMarketplaceCashfree
    ? await fetchCashfreeSplitStatus(order.paymentOrderId)
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

    const justPlaced = order.status === "AWAITING_PAYMENT"

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        paidAt: new Date(),
        paymentTxnId: result.providerTxnId,
        ...(isMarketplace && { settlementStatus: "SETTLED" as const }),
        ...(justPlaced && {
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

    if (justPlaced && order.restaurant.smsEnabled) {
      const r = order.restaurant
      const smsCallbackUrl = process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/api/v1/sms/status`
        : undefined
      if (r.notifyOrderPlaced) {
        const consumer = await prisma.consumer.findUnique({
          where: { id: order.consumerId },
          select: { name: true, phone: true },
        })
        await dispatchSms({
          restaurant: r,
          key: "ORDER_PLACED",
          toPhone: consumer?.phone,
          context: {
            restaurantName: r.name,
            orderNumber: order.orderNumber,
            orderType: order.orderType,
            customerName: consumer?.name,
          },
          orderId: order.id,
          statusCallbackUrl: smsCallbackUrl,
        })
      }
      if (r.notifyOwnerNewOrder) {
        const owner = await prisma.owner.findUnique({
          where: { id: r.ownerId },
          select: { phone: true },
        })
        const itemAgg = await prisma.orderItem.aggregate({
          where: { orderId: order.id },
          _sum: { quantity: true },
        })
        await dispatchSms({
          restaurant: r,
          key: "OWNER_NEW_ORDER",
          toPhone: owner?.phone,
          context: {
            restaurantName: r.name,
            orderNumber: order.orderNumber,
            orderType: order.orderType,
            itemCount: itemAgg._sum.quantity ?? undefined,
            total: order.totalAmount.toFixed(2),
          },
          orderId: order.id,
          statusCallbackUrl: smsCallbackUrl,
        })
      }
    }

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
