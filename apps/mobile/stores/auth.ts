import { create } from "zustand"
import { persist } from "zustand/middleware"
import { asyncStorageAdapter } from "./mmkv"

interface User {
  id: string
  name: string
  phone: string
  role: string
}

interface CanteenContext {
  canteenId: string
  canteenSlug: string
  canteenName: string
  tableId: string
  tableLabel: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  canteen: CanteenContext | null
  setAuth: (user: User, accessToken: string) => void
  setCanteen: (canteen: CanteenContext) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      canteen: null,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      setCanteen: (canteen) => set({ canteen }),
      logout: () => set({ user: null, accessToken: null, canteen: null }),
    }),
    {
      name: "orderkaro-auth",
      storage: asyncStorageAdapter,
    }
  )
)
