import { Decimal } from "@prisma/client/runtime/library"
import prisma from "@/lib/prisma"
import { gatewayForRestaurant } from "@/lib/payments"
import { fetchConnectCheckoutStatus } from "@/lib/payments/stripe-connect"
import { fetchCashfreeSplitStatus } from "@/lib/payments/cashfree-vendor"

export async function getOrCreateWallet(consumerId: string, restaurantId: string) {
  return prisma.wallet.upsert({
    where: { consumerId_restaurantId: { consumerId, restaurantId } },
    update: {},
    create: { consumerId, restaurantId },
  })
}

export type TopupOutcome = "PAID" | "PENDING" | "FAILED" | "UNKNOWN"

export async function confirmWalletTopup(transactionId: string): Promise<TopupOutcome> {
  const txn = await prisma.walletTransaction.findUnique({
    where: { id: transactionId },
    include: {
      wallet: {
        include: { restaurant: { select: { id: true, country: true } } },
      },
    },
  })

  if (!txn || txn.source !== "ONLINE" || !txn.reference) return "UNKNOWN"
  if (txn.status === "APPROVED") return "PAID"
  if (txn.status === "REJECTED") return "FAILED"

  const account = await prisma.restaurantPaymentAccount.findUnique({
    where: { restaurantId: txn.wallet.restaurantId },
  })
  if (!account) return "UNKNOWN"

  const isMarketplaceStripe =
    account.collectionMode === "MARKETPLACE" &&
    account.provider === "STRIPE" &&
    Boolean(account.stripeAccountId)
  const isMarketplaceCashfree =
    account.collectionMode === "MARKETPLACE" &&
    account.provider === "CASHFREE" &&
    Boolean(account.cashfreeVendorId)
  const result = isMarketplaceStripe
    ? await fetchConnectCheckoutStatus(txn.reference)
    : isMarketplaceCashfree
    ? await fetchCashfreeSplitStatus(txn.reference)
    : await gatewayForRestaurant(txn.wallet.restaurant).fetchStatus(account, txn.reference)

  if (result.paid) {
    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { id: txn.walletId } })
      if (!wallet) return
      const balanceBefore = new Decimal(wallet.balance.toString())
      const balanceAfter = balanceBefore.add(new Decimal(txn.amount.toString()))
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      })
      await tx.walletTransaction.update({
        where: { id: txn.id },
        data: { status: "APPROVED", balanceBefore, balanceAfter },
      })
    })
    return "PAID"
  }

  if (result.failed) {
    await prisma.walletTransaction.update({
      where: { id: txn.id },
      data: { status: "REJECTED" },
    })
    return "FAILED"
  }

  return "PENDING"
}
