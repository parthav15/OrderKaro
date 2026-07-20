import { createHmac, timingSafeEqual } from "crypto"
import { decryptSecret } from "@/lib/secure-store"
import {
  PaymentConfigurationError,
  type CheckoutRequest,
  type CheckoutSession,
  type PaymentAccountRecord,
  type PaymentGateway,
  type PaymentStatusResult,
} from "./gateway"

const PAYPUR_BASE_URL = process.env.PAYPUR_BASE_URL || "https://upi.paypur.in"

function credentials(account: PaymentAccountRecord) {
  if (!account.paypurKeyCipher || !account.paypurSaltCipher) {
    throw new PaymentConfigurationError(
      "This restaurant has not connected a PayPur account yet"
    )
  }
  return {
    apiKey: decryptSecret(account.paypurKeyCipher),
    signingSecret: decryptSecret(account.paypurSaltCipher),
  }
}

export function signInitRequest(
  orderId: string,
  amount: string,
  successUrl: string,
  failureUrl: string,
  signingSecret: string
): string {
  return createHmac("sha256", signingSecret)
    .update([orderId, amount, successUrl, failureUrl].join("|"))
    .digest("hex")
}

export function verifyCallbackSignature(
  txnId: string,
  orderId: string,
  status: string,
  amount: string,
  signature: string,
  signingSecret: string
): boolean {
  const expected = createHmac("sha256", signingSecret)
    .update([txnId, orderId, status, amount].join("|"))
    .digest("hex")
  const expectedBuffer = Buffer.from(expected)
  const providedBuffer = Buffer.from(signature)
  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  )
}

export function verifyCallbackForAccount(
  account: PaymentAccountRecord,
  params: {
    txnId: string
    orderId: string
    status: string
    amount: string
    signature: string
  }
): boolean {
  const { signingSecret } = credentials(account)
  return verifyCallbackSignature(
    params.txnId,
    params.orderId,
    params.status,
    params.amount,
    params.signature,
    signingSecret
  )
}

function isPaidStatus(status: unknown): boolean {
  return typeof status === "string" && ["success", "paid", "captured"].includes(status.toLowerCase())
}

function isFailedStatus(status: unknown): boolean {
  return (
    typeof status === "string" &&
    ["failure", "failed", "cancelled", "canceled", "expired"].includes(status.toLowerCase())
  )
}

export const paypurGateway: PaymentGateway = {
  provider: "PAYPUR",
  supportsHostedOnboarding: false,
  supportsPlatformFee: false,
  supportsWebhooks: false,
  supportsRefunds: false,

  isReady(account) {
    return Boolean(account?.paypurKeyCipher && account?.paypurSaltCipher)
  },

  async createCheckout(
    account: PaymentAccountRecord,
    request: CheckoutRequest
  ): Promise<CheckoutSession> {
    const { apiKey, signingSecret } = credentials(account)
    const amount = request.amount.toFixed(2)
    const signature = signInitRequest(
      request.orderId,
      amount,
      request.successUrl,
      request.failureUrl,
      signingSecret
    )

    const response = await fetch(`${PAYPUR_BASE_URL}/api/merchant/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-PAYPUR-KEY": apiKey },
      body: JSON.stringify({
        order_id: request.orderId,
        amount,
        surl: request.successUrl,
        furl: request.failureUrl,
        productinfo: request.description,
        firstname: request.customer.name,
        email: request.customer.email ?? "",
        phone: request.customer.phone ?? "",
        signature,
      }),
    })

    if (!response.ok) {
      throw new PaymentConfigurationError(
        `PayPur rejected the payment request (${response.status})`,
        502
      )
    }

    const data = (await response.json()) as {
      ok?: boolean
      pay_url?: string
      txn_id?: string
      qr_url?: string
      upi_intent?: string
      error?: string
    }
    if (!data.ok || !data.pay_url || !data.txn_id) {
      throw new PaymentConfigurationError(data.error || "PayPur could not start the payment", 502)
    }

    return {
      redirectUrl: data.pay_url,
      providerOrderId: data.txn_id,
      qrUrl: data.qr_url,
      upiIntent: data.upi_intent,
    }
  },

  async fetchStatus(
    account: PaymentAccountRecord,
    providerOrderId: string,
    providerTxnId?: string | null
  ): Promise<PaymentStatusResult> {
    const { apiKey } = credentials(account)
    const reference = providerTxnId || providerOrderId
    const response = await fetch(
      `${PAYPUR_BASE_URL}/api/merchant/status?txn_id=${encodeURIComponent(reference)}`,
      { headers: { "X-PAYPUR-KEY": apiKey } }
    )

    if (!response.ok) {
      return { paid: false, failed: false, amount: null, providerTxnId: providerTxnId ?? null }
    }

    const data = (await response.json()) as {
      ok?: boolean
      status?: string
      amount?: string | number
      base_amount?: string | number
      expires_at?: number
      server_time?: number
      txn_id?: string
    }

    if (!data.ok) {
      return { paid: false, failed: false, amount: null, providerTxnId: providerTxnId ?? null }
    }

    const expired =
      typeof data.expires_at === "number" &&
      typeof data.server_time === "number" &&
      data.server_time > data.expires_at

    const settledAmount = data.base_amount ?? data.amount

    return {
      paid: isPaidStatus(data.status),
      failed: isFailedStatus(data.status) || (expired && !isPaidStatus(data.status)),
      amount: settledAmount != null ? Number(settledAmount) : null,
      providerTxnId: data.txn_id ?? providerTxnId ?? null,
    }
  },
}
