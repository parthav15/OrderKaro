import { createContext, useContext, useMemo, type ReactNode } from "react"
import { useColorScheme } from "react-native"
import { bordeauxNoir, type Palette } from "./tokens"

interface ThemeValue {
  colors: Palette
  scheme: "light" | "dark"
}

const ThemeContext = createContext<ThemeValue>({
  colors: bordeauxNoir.dark,
  scheme: "dark",
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme() === "light" ? "light" : "dark"
  const value = useMemo<ThemeValue>(
    () => ({ colors: bordeauxNoir[scheme], scheme }),
    [scheme]
  )
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
