import { decryptSecret } from "@/lib/secure-store"
import {
  PaymentConfigurationError,
  type CheckoutRequest,
  type CheckoutSession,
  type PaymentAccountRecord,
  type PaymentGateway,
  type PaymentStatusResult,
} from "./gateway"

const CASHFREE_BASE_URL =
  (process.env.CASHFREE_ENV || "sandbox").toLowerCase() === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg"

const CASHFREE_API_VERSION = process.env.CASHFREE_API_VERSION || "2025-01-01"

function credentials(account: PaymentAccountRecord) {
  if (!account.cashfreeAppIdCipher || !account.cashfreeSecretCipher) {
    throw new PaymentConfigurationError(
      "This restaurant has not connected a Cashfree account yet"
    )
  }
  return {
    appId: decryptSecret(account.cashfreeAppIdCipher),
    secret: decryptSecret(account.cashfreeSecretCipher),
  }
}

function authHeaders(appId: string, secret: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-api-version": CASHFREE_API_VERSION,
    "x-client-id": appId,
    "x-client-secret": secret,
  }
}

function publicHeaders(): Record<string, string> {
  return { "Content-Type": "application/json", "x-api-version": CASHFREE_API_VERSION }
}

function isPaidStatus(status: unknown): boolean {
  return typeof status === "string" && status.toUpperCase() === "PAID"
}

function isFailedStatus(status: unknown): boolean {
  return (
    typeof status === "string" &&
    ["EXPIRED", "TERMINATED", "TERMINATION_REQUESTED", "CANCELLED"].includes(status.toUpperCase())
  )
}

export const cashfreeGateway: PaymentGateway = {
  provider: "CASHFREE",
  supportsHostedOnboarding: false,
  supportsPlatformFee: false,
  supportsWebhooks: true,
  supportsRefunds: true,

  isReady(account) {
    return Boolean(account?.cashfreeAppIdCipher && account?.cashfreeSecretCipher)
  },

  async createCheckout(
    account: PaymentAccountRecord,
    request: CheckoutRequest
  ): Promise<CheckoutSession> {
    const { appId, secret } = credentials(account)

    const orderResponse = await fetch(`${CASHFREE_BASE_URL}/orders`, {
      method: "POST",
      headers: authHeaders(appId, secret),
      body: JSON.stringify({
        order_id: request.orderId,
        order_amount: Number(request.amount.toFixed(2)),
        order_currency: request.currency,
        customer_details: {
          customer_id: request.orderId,
          customer_name: request.customer.name,
          customer_phone: request.customer.phone || "9999999999",
          customer_email: request.customer.email || undefined,
        },
        order_meta: { return_url: request.successUrl },
        order_note: request.description,
      }),
    })

    const orderData = (await orderResponse.json().catch(() => null)) as {
      payment_session_id?: string
      order_id?: string
      order_status?: string
      message?: string
    } | null

    if (!orderResponse.ok || !orderData?.payment_session_id) {
      throw new PaymentConfigurationError(
        orderData?.message || `Cashfree could not start the payment (${orderResponse.status})`,
        502
      )
    }

    const sessionResponse = await fetch(`${CASHFREE_BASE_URL}/orders/sessions`, {
      method: "POST",
      headers: publicHeaders(),
      body: JSON.stringify({
        payment_session_id: orderData.payment_session_id,
        payment_method: { upi: { channel: "link" } },
      }),
    })

    const sessionData = (await sessionResponse.json().catch(() => null)) as {
      data?: { url?: string | null; payload?: Record<string, string | null> }
    } | null

    const payload = sessionData?.data?.payload ?? {}
    const upiIntent = payload.default ?? payload.web ?? undefined
    const redirectUrl = payload.web ?? sessionData?.data?.url ?? request.successUrl

    return {
      redirectUrl,
      providerOrderId: orderData.order_id ?? request.orderId,
      upiIntent: upiIntent ?? undefined,
      paymentSessionId: orderData.payment_session_id,
    }
  },

  async fetchStatus(
    account: PaymentAccountRecord,
    providerOrderId: string
  ): Promise<PaymentStatusResult> {
    const { appId, secret } = credentials(account)
    const response = await fetch(
      `${CASHFREE_BASE_URL}/orders/${encodeURIComponent(providerOrderId)}`,
      { headers: authHeaders(appId, secret) }
    )

    if (!response.ok) {
      return { paid: false, failed: false, amount: null, providerTxnId: null }
    }

    const data = (await response.json().catch(() => null)) as {
      order_status?: string
      order_amount?: number | string
      cf_order_id?: string | number
    } | null

    if (!data) {
      return { paid: false, failed: false, amount: null, providerTxnId: null }
    }

    return {
      paid: isPaidStatus(data.order_status),
      failed: isFailedStatus(data.order_status),
      amount: data.order_amount != null ? Number(data.order_amount) : null,
      providerTxnId: data.cf_order_id != null ? String(data.cf_order_id) : null,
    }
  },
}
