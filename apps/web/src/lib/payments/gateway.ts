export type PaymentProviderName = "PAYPUR" | "STRIPE"

export interface PaymentAccountRecord {
  provider: PaymentProviderName
  status: string
  paypurKeyCipher: string | null
  paypurSaltCipher: string | null
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
}

export interface PaymentStatusResult {
  paid: boolean
  failed: boolean
  amount: number | null
  providerTxnId: string | null
}

export interface OnboardingSession {
  redirectUrl: string
  accountRef: string
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
  startOnboarding?(
    restaurant: { id: string; name: string; country: string },
    returnUrl: string,
    refreshUrl: string
  ): Promise<OnboardingSession>
  refreshAccount?(accountRef: string): Promise<{
    chargesEnabled: boolean
    payoutsEnabled: boolean
    detailsSubmitted: boolean
  }>
}

export class PaymentConfigurationError extends Error {
  status: number
  constructor(message: string, status = 422) {
    super(message)
    this.status = status
  }
}
