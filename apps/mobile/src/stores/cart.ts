import { create } from "zustand"

export interface SelectedOption {
  customizationId: string
  customizationName: string
  optionIds: string[]
  optionNames: string[]
  priceAdjustment: number
}

export interface CartLine {
  key: string
  menuItemId: string
  name: string
  basePrice: number
  quantity: number
  imageUrl: string | null
  isVeg: boolean
  selectedOptions: SelectedOption[]
  notes?: string
  availableForDelivery?: boolean
}

interface CartState {
  restaurantId: string | null
  restaurantSlug: string | null
  tableId: string | null
  lines: CartLine[]
  setContext: (restaurantId: string, slug: string, tableId: string | null) => void
  addLine: (line: Omit<CartLine, "key">) => void
  removeLine: (key: string) => void
  changeQuantity: (key: string, delta: number) => void
  clear: () => void
  lineTotal: (line: CartLine) => number
  itemCount: () => number
  subtotal: () => number
}

function lineKey(menuItemId: string, options: SelectedOption[]): string {
  const optionPart = options
    .map((o) => `${o.customizationId}:${[...o.optionIds].sort().join(",")}`)
    .sort()
    .join("|")
  return `${menuItemId}#${optionPart}`
}

export const useCart = create<CartState>((set, get) => ({
  restaurantId: null,
  restaurantSlug: null,
  tableId: null,
  lines: [],
  setContext: (restaurantId, slug, tableId) => {
    const current = get()
    if (current.restaurantId && current.restaurantId !== restaurantId) {
      set({ restaurantId, restaurantSlug: slug, tableId, lines: [] })
    } else {
      set({ restaurantId, restaurantSlug: slug, tableId })
    }
  },
  addLine: (line) => {
    const key = lineKey(line.menuItemId, line.selectedOptions)
    set((state) => {
      const existing = state.lines.find((l) => l.key === key)
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.key === key ? { ...l, quantity: l.quantity + line.quantity } : l
          ),
        }
      }
      return { lines: [...state.lines, { ...line, key }] }
    })
  },
  removeLine: (key) => set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),
  changeQuantity: (key, delta) =>
    set((state) => ({
      lines: state.lines
        .map((l) => (l.key === key ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0),
    })),
  clear: () => set({ lines: [] }),
  lineTotal: (line) => {
    const optionsPrice = line.selectedOptions.reduce((s, o) => s + o.priceAdjustment, 0)
    return (line.basePrice + optionsPrice) * line.quantity
  },
  itemCount: () => get().lines.reduce((s, l) => s + l.quantity, 0),
  subtotal: () => {
    const { lines, lineTotal } = get()
    return lines.reduce((s, l) => s + lineTotal(l), 0)
  },
}))
