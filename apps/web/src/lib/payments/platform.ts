import { encryptSecret } from "@/lib/secure-store"
import type { PaymentAccountRecord, PaymentProviderName } from "./gateway"

export function isPlatformConfigured(provider: PaymentProviderName): boolean {
  if (provider === "PAYPUR") {
    return Boolean(process.env.PAYPUR_PLATFORM_KEY && process.env.PAYPUR_PLATFORM_SALT)
  }
  if (provider === "CASHFREE") {
    return Boolean(process.env.CASHFREE_PLATFORM_APP_ID && process.env.CASHFREE_PLATFORM_SECRET)
  }
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

export function platformAccount(provider: PaymentProviderName): PaymentAccountRecord {
  const base: PaymentAccountRecord = {
    provider,
    status: "ACTIVE",
    paypurKeyCipher: null,
    paypurSaltCipher: null,
    cashfreeAppIdCipher: null,
    cashfreeSecretCipher: null,
    stripeKeyCipher: null,
    stripeAccountId: null,
    stripeChargesEnabled: false,
    stripePayoutsEnabled: false,
    stripeDetailsSubmitted: false,
  }

  if (provider === "PAYPUR") {
    return {
      ...base,
      paypurKeyCipher: encryptSecret(process.env.PAYPUR_PLATFORM_KEY as string),
      paypurSaltCipher: encryptSecret(process.env.PAYPUR_PLATFORM_SALT as string),
    }
  }

  if (provider === "CASHFREE") {
    return {
      ...base,
      cashfreeAppIdCipher: encryptSecret(process.env.CASHFREE_PLATFORM_APP_ID as string),
      cashfreeSecretCipher: encryptSecret(process.env.CASHFREE_PLATFORM_SECRET as string),
    }
  }

  return {
    ...base,
    stripeKeyCipher: encryptSecret(process.env.STRIPE_SECRET_KEY as string),
    stripeChargesEnabled: true,
  }
}
