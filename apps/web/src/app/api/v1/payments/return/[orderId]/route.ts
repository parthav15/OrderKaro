import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { confirmOrderPayment } from "@/lib/payments/confirm"
import { verifyCallbackForAccount } from "@/lib/payments/paypur"
import { resolveAppUrl } from "@/lib/app-url"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  return handleReturn(request, await params)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  return handleReturn(request, await params)
}

async function handleReturn(request: NextRequest, params: { orderId: string }) {
  const appUrl = resolveAppUrl(request)

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: { restaurant: { select: { slug: true } } },
  })

  if (!order) {
    return NextResponse.redirect(`${appUrl}/`, { status: 303 })
  }

  const trackingPath = order.trackingToken
    ? `/${order.restaurant.slug}/track/${order.trackingToken}`
    : `/${order.restaurant.slug}/menu`

  const query = new URL(request.url).searchParams
  const signature = query.get("signature")

  if (signature && order.paymentProvider === "PAYPUR") {
    const account = await prisma.restaurantPaymentAccount.findUnique({
      where: { restaurantId: order.restaurantId },
    })
    const valid =
      account &&
      verifyCallbackForAccount(account, {
        txnId: query.get("txn_id") ?? "",
        orderId: query.get("order_id") ?? "",
        status: query.get("status") ?? "",
        amount: query.get("amount") ?? "",
        signature,
      })

    if (!valid) {
      return NextResponse.redirect(`${appUrl}${trackingPath}?payment=invalid`, { status: 303 })
    }

    const txnId = query.get("txn_id")
    if (txnId && !order.paymentTxnId) {
      await prisma.order.update({ where: { id: order.id }, data: { paymentTxnId: txnId } })
    }
  }

  const outcome = await confirmOrderPayment(order.id).catch(() => "UNKNOWN")

  return NextResponse.redirect(`${appUrl}${trackingPath}?payment=${outcome.toLowerCase()}`, {
    status: 303,
  })
}
