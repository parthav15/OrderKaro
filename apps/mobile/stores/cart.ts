import { create } from "zustand"
import { persist } from "zustand/middleware"
import { asyncStorageAdapter } from "./mmkv"

interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
  isVeg: boolean
  selectedOptions: Array<{
    customizationId: string
    customizationName: string
    optionIds: string[]
    optionNames: string[]
    priceAdjustment: number
  }>
  notes?: string
}

interface CartState {
  items: CartItem[]
  canteenId: string | null
  tableId: string | null
  specialInstructions: string
  setContext: (canteenId: string, tableId: string) => void
  addItem: (item: CartItem) => void
  removeItem: (index: number) => void
  updateQuantity: (index: number, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
  setSpecialInstructions: (text: string) => void
}

export type { CartItem }

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      canteenId: null,
      tableId: null,
      specialInstructions: "",
      setContext: (canteenId, tableId) => set({ canteenId, tableId }),
      addItem: (item) =>
        set((state) => ({ items: [...state.items, item] })),
      removeItem: (index) =>
        set((state) => ({
          items: state.items.filter((_, i) => i !== index),
        })),
      updateQuantity: (index, quantity) =>
        set((state) => ({
          items: state.items.map((item, i) =>
            i === index ? { ...item, quantity } : item
          ),
        })),
      clearCart: () =>
        set({ items: [], canteenId: null, tableId: null, specialInstructions: "" }),
      getTotal: () => {
        const { items } = get()
        return items.reduce((sum, item) => {
          const optionsPrice = item.selectedOptions.reduce(
            (s, o) => s + o.priceAdjustment,
            0
          )
          return sum + (item.price + optionsPrice) * item.quantity
        }, 0)
      },
      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
      setSpecialInstructions: (text) => set({ specialInstructions: text }),
    }),
    {
      name: "orderkaro-cart",
      storage: asyncStorageAdapter,
    }
  )
)
