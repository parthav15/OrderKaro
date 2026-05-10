"use client"

import { create } from "zustand"

interface Flight {
  id: string
  src: string | null
  label: string
  isVeg: boolean
  from: { x: number; y: number; width: number; height: number }
  to: { x: number; y: number; width: number; height: number }
}

interface FlyToCartState {
  flights: Flight[]
  push: (params: {
    src: string | null
    label: string
    isVeg: boolean
    from: DOMRect
    to: DOMRect
  }) => void
  remove: (id: string) => void
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useFlyToCartStore = create<FlyToCartState>((set) => ({
  flights: [],
  push: ({ src, label, isVeg, from, to }) =>
    set((state) => ({
      flights: [
        ...state.flights,
        {
          id: newId(),
          src,
          label,
          isVeg,
          from: { x: from.left, y: from.top, width: from.width, height: from.height },
          to: { x: to.left, y: to.top, width: to.width, height: to.height },
        },
      ],
    })),
  remove: (id) => set((state) => ({ flights: state.flights.filter((f) => f.id !== id) })),
}))

export function useFlyToCart() {
  return useFlyToCartStore((s) => s.push)
}

export function triggerFlyToCart(params: {
  source: HTMLElement | null
  src: string | null
  label: string
  isVeg: boolean
}) {
  if (typeof document === "undefined") return
  if (!params.source) return
  const target = document.querySelector("[data-cart-target]") as HTMLElement | null
  if (!target) return
  useFlyToCartStore.getState().push({
    src: params.src,
    label: params.label,
    isVeg: params.isVeg,
    from: params.source.getBoundingClientRect(),
    to: target.getBoundingClientRect(),
  })
}
