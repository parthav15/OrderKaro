import {
  PaymentConfigurationError,
  type CheckoutRequest,
  type CheckoutSession,
  type OnboardingSession,
  type PaymentAccountRecord,
  type PaymentGateway,
  type PaymentStatusResult,
} from "./gateway"

const STRIPE_API = "https://api.stripe.com/v1"

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

function secretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new PaymentConfigurationError("Stripe is not configured", 503)
  return key
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
  path: string,
  init?: { method?: string; body?: string }
): Promise<T> {
  const response = await fetch(`${STRIPE_API}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
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

export const stripeGateway: PaymentGateway = {
  provider: "STRIPE",
  supportsHostedOnboarding: true,
  supportsPlatformFee: true,
  supportsWebhooks: true,
  supportsRefunds: true,

  isReady(account) {
    return Boolean(account?.stripeAccountId && account.stripeChargesEnabled)
  },

  async startOnboarding(
    restaurant: { id: string; name: string; country: string },
    returnUrl: string,
    refreshUrl: string
  ): Promise<OnboardingSession> {
    const account = await stripeRequest<{ id: string }>("/accounts", {
      method: "POST",
      body: encodeForm({
        type: "express",
        country: restaurant.country,
        "business_profile[name]": restaurant.name,
        "capabilities[card_payments][requested]": "true",
        "capabilities[transfers][requested]": "true",
        "metadata[restaurantId]": restaurant.id,
      }),
    })

    const link = await stripeRequest<{ url: string }>("/account_links", {
      method: "POST",
      body: encodeForm({
        account: account.id,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: "account_onboarding",
      }),
    })

    return { redirectUrl: link.url, accountRef: account.id }
  },

  async refreshAccount(accountRef: string) {
    const account = await stripeRequest<{
      charges_enabled: boolean
      payouts_enabled: boolean
      details_submitted: boolean
    }>(`/accounts/${accountRef}`)

    return {
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    }
  },

  async createCheckout(
    account: PaymentAccountRecord,
    request: CheckoutRequest
  ): Promise<CheckoutSession> {
    if (!account.stripeAccountId) {
      throw new PaymentConfigurationError(
        "This restaurant has not connected a Stripe account yet"
      )
    }

    const currency = request.currency.toLowerCase()
    const session = await stripeRequest<{ id: string; url: string }>("/checkout/sessions", {
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
        "payment_intent_data[application_fee_amount]": toMinorUnits(
          request.platformFee,
          currency
        ),
        "payment_intent_data[transfer_data][destination]": account.stripeAccountId,
        "metadata[orderId]": request.orderId,
        customer_email: request.customer.email,
      }),
    })

    return { redirectUrl: session.url, providerOrderId: session.id }
  },

  async fetchStatus(
    _account: PaymentAccountRecord,
    providerOrderId: string
  ): Promise<PaymentStatusResult> {
    const session = await stripeRequest<{
      payment_status: string
      status: string
      amount_total: number | null
      currency: string
      payment_intent: string | null
    }>(`/checkout/sessions/${providerOrderId}`)

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
