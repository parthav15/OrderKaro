import AsyncStorage from "@react-native-async-storage/async-storage"
import { createJSONStorage } from "zustand/middleware"

export const asyncStorageAdapter = createJSONStorage(() => ({
  getItem: async (name: string) => {
    const value = await AsyncStorage.getItem(name)
    return value ?? null
  },
  setItem: async (name: string, value: string) => {
    await AsyncStorage.setItem(name, value)
  },
  removeItem: async (name: string) => {
    await AsyncStorage.removeItem(name)
  },
}))
