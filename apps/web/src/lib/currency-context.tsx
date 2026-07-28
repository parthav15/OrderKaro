"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import { formatPrice } from "@/lib/utils"

const CurrencyContext = createContext<string>("INR")

export function CurrencyProvider({ currency, children }: { currency: string; children: ReactNode }) {
  return <CurrencyContext.Provider value={currency || "INR"}>{children}</CurrencyContext.Provider>
}

export function useCurrency(): string {
  return useContext(CurrencyContext)
}

export function useMoney(): (price: number | string) => string {
  const currency = useContext(CurrencyContext)
  return useMemo(() => (price: number | string) => formatPrice(price, currency), [currency])
}
