import { NextRequest, NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import prisma from "@/lib/prisma"
import { confirmOrderPayment } from "@/lib/payments/confirm"

function verifyStripeSignature(payload: string, header: string, secret: string): boolean {
  const parts = Object.fromEntries(
    header.split(",").map((part) => part.split("=") as [string, string])
  )
  const timestamp = parts["t"]
  const provided = parts["v1"]
  if (!timestamp || !provided) return false

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex")

  const expectedBuffer = Buffer.from(expected)
  const providedBuffer = Buffer.from(provided)
  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  )
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ received: false }, { status: 503 })
  }

  const signature = request.headers.get("stripe-signature")
  const payload = await request.text()

  if (!signature || !verifyStripeSignature(payload, signature, secret)) {
    return NextResponse.json({ received: false }, { status: 400 })
  }

  const event = JSON.parse(payload) as {
    type: string
    data: { object: Record<string, unknown> }
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as { id?: string; client_reference_id?: string }
    const orderId = session.client_reference_id
    if (orderId) {
      await confirmOrderPayment(orderId).catch(() => undefined)
    }
  }

  if (event.type === "account.updated") {
    const account = event.data.object as {
      id?: string
      charges_enabled?: boolean
      payouts_enabled?: boolean
      details_submitted?: boolean
    }
    if (account.id) {
      await prisma.restaurantPaymentAccount
        .updateMany({
          where: { stripeAccountId: account.id },
          data: {
            stripeChargesEnabled: Boolean(account.charges_enabled),
            stripePayoutsEnabled: Boolean(account.payouts_enabled),
            stripeDetailsSubmitted: Boolean(account.details_submitted),
            status: account.charges_enabled ? "ACTIVE" : "PENDING",
            lastCheckedAt: new Date(),
          },
        })
        .catch(() => undefined)
    }
  }

  return NextResponse.json({ received: true })
}
