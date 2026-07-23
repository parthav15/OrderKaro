"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { AnimatePresence, motion } from "framer-motion"
import { Sun, Moon } from "lucide-react"

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === "dark"

  return (
    <button
      type="button"
      aria-label="Toggle light or dark theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-line bg-surface text-accent transition-colors hover:bg-surface-elevated ${className}`}
    >
      {mounted ? (
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isDark ? "moon" : "sun"}
            initial={{ y: 14, opacity: 0, rotate: -35 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -14, opacity: 0, rotate: 35 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {isDark ? <Moon size={18} /> : <Sun size={18} />}
          </motion.span>
        </AnimatePresence>
      ) : (
        <span className="h-[18px] w-[18px]" />
      )}
    </button>
  )
}
