const CURRENCY_SYMBOL: Record<string, string> = {
  INR: "₹",
  USD: "$",
  CAD: "$",
  AUD: "$",
  NZD: "$",
  SGD: "$",
  HKD: "$",
  MXN: "$",
  GBP: "£",
  EUR: "€",
  JPY: "¥",
  CHF: "CHF ",
  AED: "AED ",
  SAR: "SAR ",
  QAR: "QAR ",
  BHD: "BHD ",
  KWD: "KWD ",
  MYR: "RM ",
  IDR: "Rp ",
  THB: "฿",
  PHP: "₱",
  VND: "₫",
  SEK: "kr ",
  NOK: "kr ",
  DKK: "kr ",
  PLN: "zł ",
  ZAR: "R ",
  NGN: "₦",
  KES: "KSh ",
  BRL: "R$ ",
}

const ZERO_DECIMAL = new Set(["INR", "JPY", "VND", "IDR", "KRW"])

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

export function formatPrice(amount: number | string, currency = "INR"): string {
  const value = Number(amount)
  if (!Number.isFinite(value)) return `${amount}`
  const symbol = CURRENCY_SYMBOL[currency] ?? `${currency} `
  const fractionDigits = ZERO_DECIMAL.has(currency) ? 0 : 2
  const fixed = Math.abs(value).toFixed(fractionDigits)
  const [whole, fraction] = fixed.split(".")
  const grouped = groupThousands(whole)
  const body = fraction ? `${grouped}.${fraction}` : grouped
  return `${value < 0 ? "-" : ""}${symbol}${body}`
}
