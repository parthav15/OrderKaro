import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CURRENCY_LOCALE: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  GBP: "en-GB",
  EUR: "en-IE",
  CAD: "en-CA",
  AUD: "en-AU",
  NZD: "en-NZ",
  SGD: "en-SG",
  AED: "en-AE",
  CHF: "de-CH",
  JPY: "ja-JP",
}

const ZERO_DECIMAL_CURRENCIES = new Set(["INR", "JPY", "VND", "IDR", "KRW"])

export function formatPrice(price: number | string, currency = "INR") {
  const value = Number(price)
  const fractionDigits = ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2
  try {
    return new Intl.NumberFormat(CURRENCY_LOCALE[currency] ?? "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value)
  } catch {
    return `${value.toFixed(fractionDigits)}`
  }
}

export function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function getTimeSince(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`
}

export function orderDestinationLabel(order: {
  orderType?: string | null
  deliveryLocation?: string | null
  table?: { label?: string | null } | null
}): string {
  if (order.orderType === "TAKEAWAY") return "Takeaway"
  if (order.orderType === "DELIVERY") {
    return order.deliveryLocation ? `Delivery — ${order.deliveryLocation}` : "Delivery"
  }
  return order.table?.label || "Takeaway"
}
