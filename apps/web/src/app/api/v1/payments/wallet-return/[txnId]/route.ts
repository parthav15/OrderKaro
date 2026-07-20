import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { confirmWalletTopup } from "@/lib/wallet"
import { verifyCallbackForAccount } from "@/lib/payments/paypur"
import { resolveAppUrl } from "@/lib/app-url"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ txnId: string }> }
) {
  return handleReturn(request, await params)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ txnId: string }> }
) {
  return handleReturn(request, await params)
}

async function handleReturn(request: NextRequest, params: { txnId: string }) {
  const appUrl = resolveAppUrl(request)

  const txn = await prisma.walletTransaction.findUnique({
    where: { id: params.txnId },
    include: { wallet: { include: { restaurant: { select: { slug: true } } } } },
  })

  if (!txn) return NextResponse.redirect(`${appUrl}/`, { status: 303 })

  const slug = txn.wallet.restaurant.slug
  const walletPath = `/${slug}/cart`
  const query = new URL(request.url).searchParams
  const signature = query.get("signature")

  if (signature) {
    const account = await prisma.restaurantPaymentAccount.findUnique({
      where: { restaurantId: txn.wallet.restaurantId },
    })
    const valid =
      account &&
      account.provider === "PAYPUR" &&
      verifyCallbackForAccount(account, {
        txnId: query.get("txn_id") ?? "",
        orderId: query.get("order_id") ?? "",
        status: query.get("status") ?? "",
        amount: query.get("amount") ?? "",
        signature,
      })
    if (!valid) {
      return NextResponse.redirect(`${appUrl}${walletPath}?topup=invalid`, { status: 303 })
    }
  }

  const outcome = await confirmWalletTopup(txn.id).catch(() => "UNKNOWN")

  return NextResponse.redirect(`${appUrl}${walletPath}?topup=${outcome.toLowerCase()}`, {
    status: 303,
  })
}
