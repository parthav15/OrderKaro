import prisma from "@/lib/prisma"
import { gatewayFor } from "@/lib/payments"
import { platformAccount } from "@/lib/payments/platform"
import { SUBSCRIPTION_DAYS } from "@/lib/plans"

export type BillingOutcome = "PAID" | "PENDING" | "FAILED" | "UNKNOWN"

export async function confirmSubscriptionPayment(subscriptionId: string): Promise<BillingOutcome> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { restaurant: { select: { id: true, plan: true, planValidUntil: true } } },
  })

  if (!subscription || !subscription.provider || !subscription.providerOrderId) return "UNKNOWN"
  if (subscription.status === "ACTIVE") return "PAID"

  const gateway = gatewayFor(subscription.provider)
  const result = await gateway.fetchStatus(
    platformAccount(subscription.provider),
    subscription.providerOrderId,
    subscription.providerTxnId
  )

  if (result.paid) {
    const now = new Date()
    const current = subscription.restaurant
    const stillValid =
      current.planValidUntil && current.planValidUntil.getTime() > now.getTime()
    const periodStart = stillValid ? current.planValidUntil! : now
    const periodEnd = new Date(periodStart.getTime() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000)

    await prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "ACTIVE",
          providerTxnId: result.providerTxnId,
          periodStart,
          periodEnd,
        },
      })
      await tx.restaurant.update({
        where: { id: subscription.restaurantId },
        data: { plan: subscription.plan, planValidUntil: periodEnd },
      })
    })
    return "PAID"
  }

  if (result.failed) {
    if (subscription.status === "PENDING") {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: "FAILED" },
      })
    }
    return "FAILED"
  }

  return "PENDING"
}
