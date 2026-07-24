import { decryptSecret } from "@/lib/secure-store"
import { platformAccount, isPlatformConfigured } from "./platform"
import { PaymentConfigurationError } from "./gateway"

const CASHFREE_BASE_URL =
  (process.env.CASHFREE_ENV || "sandbox").toLowerCase() === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg"

const CASHFREE_API_VERSION = process.env.CASHFREE_API_VERSION || "2025-01-01"

export type VendorKyc = "PENDING" | "VERIFIED" | "REJECTED"

export interface VendorPayout {
  vendorId: string
  name: string
  email: string
  phone: string
  pan: string
  method: "BANK" | "UPI"
  bankAccount?: string
  ifsc?: string
  upi?: string
}

export interface VendorResult {
  vendorId: string
  kycStatus: VendorKyc
}

function mapKyc(status: unknown): VendorKyc {
  const value = typeof status === "string" ? status.toUpperCase() : ""
  if (value === "ACTIVE") return "VERIFIED"
  if (value === "BLOCKED" || value === "DELETED") return "REJECTED"
  return "PENDING"
}

export async function createCashfreeVendor(payout: VendorPayout): Promise<VendorResult> {
  if (!isPlatformConfigured("CASHFREE")) {
    throw new PaymentConfigurationError("The platform's Cashfree payout account is not configured")
  }
  const account = platformAccount("CASHFREE")
  const appId = decryptSecret(account.cashfreeAppIdCipher as string)
  const secret = decryptSecret(account.cashfreeSecretCipher as string)

  const body: Record<string, unknown> = {
    vendor_id: payout.vendorId,
    status: "ACTIVE",
    name: payout.name,
    email: payout.email,
    phone: payout.phone,
    verify_account: true,
    dashboard_access: false,
    kyc_details: {
      account_type: "PROPRIETORSHIP",
      business_type: "Food and Beverages",
      pan: payout.pan,
    },
  }
  if (payout.method === "UPI") {
    body.upi = { vpa: payout.upi, account_holder: payout.name }
  } else {
    body.bank = { account_number: payout.bankAccount, account_holder: payout.name, ifsc: payout.ifsc }
  }

  const response = await fetch(`${CASHFREE_BASE_URL}/easy-split/vendors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-version": CASHFREE_API_VERSION,
      "x-client-id": appId,
      "x-client-secret": secret,
    },
    body: JSON.stringify(body),
  })
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>
  if (!response.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : "Could not register the payout vendor with Cashfree"
    throw new PaymentConfigurationError(message)
  }
  return { vendorId: payout.vendorId, kycStatus: mapKyc(data.status) }
}

function platformCredentials() {
  if (!isPlatformConfigured("CASHFREE")) {
    throw new PaymentConfigurationError("The platform's Cashfree account is not configured")
  }
  const account = platformAccount("CASHFREE")
  return {
    appId: decryptSecret(account.cashfreeAppIdCipher as string),
    secret: decryptSecret(account.cashfreeSecretCipher as string),
  }
}

function platformAuthHeaders(appId: string, secret: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-api-version": CASHFREE_API_VERSION,
    "x-client-id": appId,
    "x-client-secret": secret,
  }
}

export interface CashfreeSplitCheckoutInput {
  orderId: string
  amount: number
  currency: string
  vendorId: string
  restaurantShare: number
  description: string
  customerName: string
  customerPhone?: string
  successUrl: string
}

export interface CashfreeSplitSession {
  redirectUrl: string
  providerOrderId: string
  upiIntent?: string
}

export async function createCashfreeSplitCheckout(
  input: CashfreeSplitCheckoutInput
): Promise<CashfreeSplitSession> {
  const { appId, secret } = platformCredentials()

  const orderResponse = await fetch(`${CASHFREE_BASE_URL}/orders`, {
    method: "POST",
    headers: platformAuthHeaders(appId, secret),
    body: JSON.stringify({
      order_id: input.orderId,
      order_amount: Number(input.amount.toFixed(2)),
      order_currency: input.currency,
      customer_details: {
        customer_id: input.orderId,
        customer_name: input.customerName,
        customer_phone: input.customerPhone || "9999999999",
      },
      order_meta: { return_url: input.successUrl },
      order_note: input.description,
      order_splits: [
        { vendor_id: input.vendorId, amount: Number(input.restaurantShare.toFixed(2)) },
      ],
    }),
  })

  const orderData = (await orderResponse.json().catch(() => null)) as {
    payment_session_id?: string
    order_id?: string
    message?: string
  } | null

  if (!orderResponse.ok || !orderData?.payment_session_id) {
    throw new PaymentConfigurationError(
      orderData?.message || `Cashfree could not start the split payment (${orderResponse.status})`,
      502
    )
  }

  const sessionResponse = await fetch(`${CASHFREE_BASE_URL}/orders/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-version": CASHFREE_API_VERSION },
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
  const redirectUrl = payload.web ?? sessionData?.data?.url ?? input.successUrl

  return {
    redirectUrl,
    providerOrderId: orderData.order_id ?? input.orderId,
    upiIntent: upiIntent ?? undefined,
  }
}

export async function fetchCashfreeSplitStatus(providerOrderId: string): Promise<{
  paid: boolean
  failed: boolean
  amount: number | null
  providerTxnId: string | null
}> {
  const { appId, secret } = platformCredentials()
  const response = await fetch(
    `${CASHFREE_BASE_URL}/orders/${encodeURIComponent(providerOrderId)}`,
    { headers: platformAuthHeaders(appId, secret) }
  )
  if (!response.ok) return { paid: false, failed: false, amount: null, providerTxnId: null }

  const data = (await response.json().catch(() => null)) as {
    order_status?: string
    order_amount?: number | string
    cf_order_id?: string | number
  } | null
  if (!data) return { paid: false, failed: false, amount: null, providerTxnId: null }

  const status = typeof data.order_status === "string" ? data.order_status.toUpperCase() : ""
  return {
    paid: status === "PAID",
    failed: ["EXPIRED", "TERMINATED", "TERMINATION_REQUESTED", "CANCELLED"].includes(status),
    amount: data.order_amount != null ? Number(data.order_amount) : null,
    providerTxnId: data.cf_order_id != null ? String(data.cf_order_id) : null,
  }
}
