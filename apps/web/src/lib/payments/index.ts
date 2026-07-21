import { paypurGateway } from "./paypur"
import { stripeGateway } from "./stripe"
import { cashfreeGateway } from "./cashfree"
import type { PaymentGateway, PaymentProviderName } from "./gateway"

const GATEWAYS: Record<PaymentProviderName, PaymentGateway> = {
  PAYPUR: paypurGateway,
  STRIPE: stripeGateway,
  CASHFREE: cashfreeGateway,
}

const CASHFREE_COUNTRIES = new Set(["IN"])

export function providerForCountry(country: string): PaymentProviderName {
  return CASHFREE_COUNTRIES.has(country.toUpperCase()) ? "CASHFREE" : "STRIPE"
}

export function currencyForCountry(country: string): string {
  const currencies: Record<string, string> = {
    IN: "INR",
    US: "USD",
    CA: "CAD",
    GB: "GBP",
    AU: "AUD",
    CH: "CHF",
  }
  return currencies[country.toUpperCase()] ?? "EUR"
}

export function gatewayFor(provider: PaymentProviderName): PaymentGateway {
  return GATEWAYS[provider]
}

export function gatewayForRestaurant(restaurant: { country: string }): PaymentGateway {
  return GATEWAYS[providerForCountry(restaurant.country)]
}

export * from "./gateway"
