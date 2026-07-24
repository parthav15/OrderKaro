import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { confirmSubscriptionPayment } from "@/lib/payments/confirm-billing"
import { verifyCallbackSignature } from "@/lib/payments/paypur"
import { resolveAppUrl } from "@/lib/app-url"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  return handleReturn(request, await params)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  return handleReturn(request, await params)
}

async function handleReturn(request: NextRequest, params: { subscriptionId: string }) {
  const appUrl = resolveAppUrl(request)
  const billingPath = "/owner/billing"

  const subscription = await prisma.subscription.findUnique({
    where: { id: params.subscriptionId },
  })
  if (!subscription) {
    return NextResponse.redirect(`${appUrl}${billingPath}`, { status: 303 })
  }

  const query = new URL(request.url).searchParams
  const signature = query.get("signature")

  if (signature && subscription.provider === "PAYPUR") {
    const valid = verifyCallbackSignature(
      query.get("txn_id") ?? "",
      query.get("order_id") ?? "",
      query.get("status") ?? "",
      query.get("amount") ?? "",
      signature,
      process.env.PAYPUR_PLATFORM_SALT as string
    )
    if (!valid) {
      return NextResponse.redirect(`${appUrl}${billingPath}?billing=invalid`, { status: 303 })
    }
    const txnId = query.get("txn_id")
    if (txnId && !subscription.providerTxnId) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { providerTxnId: txnId },
      })
    }
  }

  const outcome = await confirmSubscriptionPayment(subscription.id).catch(() => "UNKNOWN")

  return NextResponse.redirect(`${appUrl}${billingPath}?billing=${outcome.toLowerCase()}`, {
    status: 303,
  })
}
