export type PaymentProviderName = "PAYPUR" | "STRIPE" | "CASHFREE"

export interface PaymentAccountRecord {
  provider: PaymentProviderName
  status: string
  paypurKeyCipher: string | null
  paypurSaltCipher: string | null
  cashfreeAppIdCipher: string | null
  cashfreeSecretCipher: string | null
  stripeKeyCipher: string | null
  stripeAccountId: string | null
  stripeChargesEnabled: boolean
  stripePayoutsEnabled: boolean
  stripeDetailsSubmitted: boolean
}

export interface CheckoutRequest {
  orderId: string
  amount: number
  currency: string
  platformFee: number
  description: string
  customer: { name: string; email?: string; phone?: string }
  successUrl: string
  failureUrl: string
}

export interface CheckoutSession {
  redirectUrl: string
  providerOrderId: string
  qrUrl?: string
  upiIntent?: string
}

export interface PaymentStatusResult {
  paid: boolean
  failed: boolean
  amount: number | null
  providerTxnId: string | null
}

export interface PaymentGateway {
  readonly provider: PaymentProviderName
  readonly supportsHostedOnboarding: boolean
  readonly supportsPlatformFee: boolean
  readonly supportsWebhooks: boolean
  readonly supportsRefunds: boolean

  isReady(account: PaymentAccountRecord | null): boolean
  createCheckout(
    account: PaymentAccountRecord,
    request: CheckoutRequest
  ): Promise<CheckoutSession>
  fetchStatus(
    account: PaymentAccountRecord,
    providerOrderId: string,
    providerTxnId?: string | null
  ): Promise<PaymentStatusResult>
}

export class PaymentConfigurationError extends Error {
  status: number
  constructor(message: string, status = 422) {
    super(message)
    this.status = status
  }
}
