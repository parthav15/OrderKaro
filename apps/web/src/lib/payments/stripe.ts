import { decryptSecret } from "@/lib/secure-store"
import {
  PaymentConfigurationError,
  type CheckoutRequest,
  type CheckoutSession,
  type PaymentAccountRecord,
  type PaymentGateway,
  type PaymentStatusResult,
} from "./gateway"

const STRIPE_API = "https://api.stripe.com/v1"

function restaurantKey(account: PaymentAccountRecord): string {
  if (!account.stripeKeyCipher) {
    throw new PaymentConfigurationError(
      "This restaurant has not connected a Stripe account yet"
    )
  }
  return decryptSecret(account.stripeKeyCipher)
}

function encodeForm(payload: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue
    params.append(key, String(value))
  }
  return params.toString()
}

async function stripeRequest<T>(
  secretKey: string,
  path: string,
  init?: { method?: string; body?: string }
): Promise<T> {
  const response = await fetch(`${STRIPE_API}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: init?.body,
  })

  const data = (await response.json()) as T & { error?: { message?: string } }
  if (!response.ok) {
    throw new PaymentConfigurationError(
      data.error?.message || `Stripe request failed (${response.status})`,
      502
    )
  }
  return data
}

function zeroDecimalCurrency(currency: string): boolean {
  return ["jpy", "krw", "vnd", "clp"].includes(currency.toLowerCase())
}

export function toMinorUnits(amount: number, currency: string): number {
  return zeroDecimalCurrency(currency) ? Math.round(amount) : Math.round(amount * 100)
}

export async function verifyStripeKey(secretKey: string): Promise<boolean> {
  try {
    await stripeRequest<{ id: string }>(secretKey, "/account")
    return true
  } catch {
    return false
  }
}

export const stripeGateway: PaymentGateway = {
  provider: "STRIPE",
  supportsHostedOnboarding: false,
  supportsPlatformFee: false,
  supportsWebhooks: false,
  supportsRefunds: true,

  isReady(account) {
    return Boolean(account?.stripeKeyCipher)
  },

  async createCheckout(
    account: PaymentAccountRecord,
    request: CheckoutRequest
  ): Promise<CheckoutSession> {
    const secretKey = restaurantKey(account)
    const currency = request.currency.toLowerCase()

    const session = await stripeRequest<{ id: string; url: string }>(
      secretKey,
      "/checkout/sessions",
      {
        method: "POST",
        body: encodeForm({
          mode: "payment",
          success_url: request.successUrl,
          cancel_url: request.failureUrl,
          client_reference_id: request.orderId,
          "line_items[0][quantity]": 1,
          "line_items[0][price_data][currency]": currency,
          "line_items[0][price_data][unit_amount]": toMinorUnits(request.amount, currency),
          "line_items[0][price_data][product_data][name]": request.description,
          "metadata[orderId]": request.orderId,
          customer_email: request.customer.email,
        }),
      }
    )

    return { redirectUrl: session.url, providerOrderId: session.id }
  },

  async fetchStatus(
    account: PaymentAccountRecord,
    providerOrderId: string
  ): Promise<PaymentStatusResult> {
    const secretKey = restaurantKey(account)
    const session = await stripeRequest<{
      payment_status: string
      status: string
      amount_total: number | null
      currency: string
      payment_intent: string | null
    }>(secretKey, `/checkout/sessions/${providerOrderId}`)

    const currency = session.currency ?? "usd"
    const divisor = zeroDecimalCurrency(currency) ? 1 : 100

    return {
      paid: session.payment_status === "paid",
      failed: session.status === "expired",
      amount: session.amount_total != null ? session.amount_total / divisor : null,
      providerTxnId: session.payment_intent,
    }
  },
}
