import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useColorScheme } from "nativewind"
import * as SecureStore from "expo-secure-store"
import { bordeauxNoir, type Palette } from "./tokens"

const STORAGE_KEY = "orderkaro-theme-mode"

type Mode = "light" | "dark" | "system"

interface ThemeValue {
  colors: Palette
  scheme: "light" | "dark"
  mode: Mode
  setMode: (mode: Mode) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme()
  const [mode, setModeState] = useState<Mode>("system")

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then((stored) => {
      if (stored === "light" || stored === "dark") {
        setModeState(stored)
        setColorScheme(stored)
      }
    })
  }, [setColorScheme])

  const scheme = colorScheme === "light" ? "light" : "dark"

  function setMode(next: Mode) {
    setModeState(next)
    setColorScheme(next)
    if (next === "system") SecureStore.deleteItemAsync(STORAGE_KEY)
    else SecureStore.setItemAsync(STORAGE_KEY, next)
  }

  function toggle() {
    setMode(scheme === "dark" ? "light" : "dark")
  }

  const value: ThemeValue = {
    colors: bordeauxNoir[scheme],
    scheme,
    mode,
    setMode,
    toggle,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
