import { decryptSecret } from "@/lib/secure-store"
import { platformAccount, isPlatformConfigured } from "./platform"
import { PaymentConfigurationError } from "./gateway"
import { toMinorUnits } from "./stripe"

const STRIPE_API = "https://api.stripe.com/v1"

function platformKey(): string {
  if (!isPlatformConfigured("STRIPE")) {
    throw new PaymentConfigurationError("The platform's Stripe account is not configured")
  }
  return decryptSecret(platformAccount("STRIPE").stripeKeyCipher as string)
}

function encodeForm(payload: Record<string, string | number | boolean | undefined>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue
    params.append(key, String(value))
  }
  return params.toString()
}

async function stripeCall<T>(path: string, init?: { method?: string; body?: string }): Promise<T> {
  const response = await fetch(`${STRIPE_API}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${platformKey()}`,
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

export interface ConnectAccountStatus {
  accountId: string
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
}

export async function createConnectedAccount(input: {
  email?: string
  country: string
  businessName: string
}): Promise<string> {
  const account = await stripeCall<{ id: string }>("/accounts", {
    method: "POST",
    body: encodeForm({
      type: "express",
      country: input.country,
      email: input.email,
      "capabilities[card_payments][requested]": "true",
      "capabilities[transfers][requested]": "true",
      "business_profile[name]": input.businessName,
      "business_profile[product_description]": "Restaurant food orders via Vision Menu",
    }),
  })
  return account.id
}

export async function createOnboardingLink(input: {
  accountId: string
  refreshUrl: string
  returnUrl: string
}): Promise<string> {
  const link = await stripeCall<{ url: string }>("/account_links", {
    method: "POST",
    body: encodeForm({
      account: input.accountId,
      refresh_url: input.refreshUrl,
      return_url: input.returnUrl,
      type: "account_onboarding",
    }),
  })
  return link.url
}

export async function fetchConnectStatus(accountId: string): Promise<ConnectAccountStatus> {
  const account = await stripeCall<{
    id: string
    charges_enabled: boolean
    payouts_enabled: boolean
    details_submitted: boolean
  }>(`/accounts/${accountId}`)
  return {
    accountId: account.id,
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
    detailsSubmitted: Boolean(account.details_submitted),
  }
}

export interface ConnectCheckoutInput {
  orderId: string
  amount: number
  currency: string
  applicationFee: number
  description: string
  destinationAccountId: string
  customerEmail?: string
  successUrl: string
  failureUrl: string
}

export async function createConnectCheckout(
  input: ConnectCheckoutInput
): Promise<{ redirectUrl: string; providerOrderId: string }> {
  const currency = input.currency.toLowerCase()
  const session = await stripeCall<{ id: string; url: string }>("/checkout/sessions", {
    method: "POST",
    body: encodeForm({
      mode: "payment",
      success_url: input.successUrl,
      cancel_url: input.failureUrl,
      client_reference_id: input.orderId,
      "line_items[0][quantity]": 1,
      "line_items[0][price_data][currency]": currency,
      "line_items[0][price_data][unit_amount]": toMinorUnits(input.amount, currency),
      "line_items[0][price_data][product_data][name]": input.description,
      "payment_intent_data[application_fee_amount]": toMinorUnits(input.applicationFee, currency),
      "payment_intent_data[transfer_data][destination]": input.destinationAccountId,
      "metadata[orderId]": input.orderId,
      customer_email: input.customerEmail,
    }),
  })
  return { redirectUrl: session.url, providerOrderId: session.id }
}

export async function fetchConnectCheckoutStatus(providerOrderId: string): Promise<{
  paid: boolean
  failed: boolean
  amount: number | null
  providerTxnId: string | null
}> {
  const session = await stripeCall<{
    payment_status: string
    status: string
    amount_total: number | null
    currency: string
    payment_intent: string | null
  }>(`/checkout/sessions/${providerOrderId}`)
  const currency = (session.currency ?? "usd").toLowerCase()
  const divisor = ["jpy", "krw", "vnd", "clp"].includes(currency) ? 1 : 100
  return {
    paid: session.payment_status === "paid",
    failed: session.status === "expired",
    amount: session.amount_total != null ? session.amount_total / divisor : null,
    providerTxnId: session.payment_intent,
  }
}
