"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Search, Wallet, X } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface MenuStickyHeaderProps {
  canteenName: string
  walletBalance: number | null
  search: string
  onSearchChange: (value: string) => void
  children?: React.ReactNode
}

export function MenuStickyHeader({
  canteenName,
  walletBalance,
  search,
  onSearchChange,
  children,
}: MenuStickyHeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault()
        const input = document.getElementById("menu-search") as HTMLInputElement | null
        input?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <motion.div
      initial={false}
      animate={{
        backgroundColor: scrolled ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,1)",
      }}
      transition={{ duration: 0.2 }}
      className={cn(
        "sticky top-0 z-30 backdrop-blur-xl",
        scrolled && "border-b border-brand-black/[0.06]"
      )}
    >
      <div className="px-5 pt-3 pb-2 flex items-center gap-3">
        <motion.span
          initial={false}
          animate={{
            opacity: scrolled ? 1 : 0,
            width: scrolled ? "auto" : 0,
            marginRight: scrolled ? 4 : 0,
          }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="font-heading text-base font-extrabold text-brand-black tracking-tight whitespace-nowrap overflow-hidden"
        >
          {canteenName}
        </motion.span>

        <div className="relative flex-1">
          <Search
            className={cn(
              "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
              searchFocused ? "text-brand-black" : "text-brand-black/40"
            )}
            strokeWidth={2.2}
          />
          <input
            id="menu-search"
            type="text"
            placeholder="Search dishes"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={cn(
              "w-full pl-10 pr-10 py-2.5 rounded-full text-sm font-medium transition-colors",
              "bg-brand-black/[0.04] focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-black/15",
              "placeholder:text-brand-black/40"
            )}
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-brand-black/8 hover:bg-brand-black/15 flex items-center justify-center transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3 h-3 text-brand-black" strokeWidth={2.4} />
            </button>
          ) : (
            <span className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 items-center justify-center px-1.5 py-0.5 text-[10px] font-bold text-brand-black/40 bg-brand-black/[0.05] rounded-md">
              /
            </span>
          )}
        </div>

        {walletBalance !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hidden sm:inline-flex items-center gap-1.5 bg-brand-black text-white rounded-full px-3 py-1.5"
          >
            <Wallet className="w-3.5 h-3.5" strokeWidth={2.2} />
            <span className="text-xs font-bold tabular-nums">{formatPrice(walletBalance)}</span>
          </motion.div>
        )}
      </div>

      {children}
    </motion.div>
  )
}
