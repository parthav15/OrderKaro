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
      business_type: "Food and Beverage",
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
