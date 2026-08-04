"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Search, X, Receipt } from "lucide-react"
import { cn } from "@/lib/utils"

interface MenuStickyHeaderProps {
  restaurantName: string
  search: string
  onSearchChange: (value: string) => void
  account?: React.ReactNode
  children?: React.ReactNode
}

export function MenuStickyHeader({
  restaurantName,
  search,
  onSearchChange,
  account,
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
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "sticky top-0 z-30 backdrop-blur-xl transition-colors duration-200",
        scrolled ? "bg-surface/[0.88] border-b border-ink/[0.06]" : "bg-surface"
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
          className="font-heading text-base font-extrabold text-ink tracking-tight whitespace-nowrap overflow-hidden"
        >
          {restaurantName}
        </motion.span>

        <div className="relative flex-1">
          <Search
            className={cn(
              "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
              searchFocused ? "text-ink" : "text-ink/40"
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
              "bg-ink/[0.04] focus:bg-surface focus:outline-none focus:ring-2 focus:ring-ink/15",
              "placeholder:text-ink/40"
            )}
          />
          {search ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-ink/[0.08] hover:bg-ink/15 flex items-center justify-center transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3 h-3 text-ink" strokeWidth={2.4} />
            </motion.button>
          ) : (
            <span className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 items-center justify-center px-1.5 py-0.5 text-[10px] font-bold text-ink/40 bg-ink/[0.05] rounded-md">
              /
            </span>
          )}
        </div>

        <motion.div whileTap={{ scale: 0.94 }} className="shrink-0">
          <Link
            href="/orders"
            aria-label="My orders"
            className="flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-ink/[0.04] hover:bg-ink/[0.08] text-ink transition-colors"
          >
            <Receipt className="w-4 h-4" strokeWidth={2.2} />
            <span className="hidden sm:inline text-sm font-semibold">Orders</span>
          </Link>
        </motion.div>

        {account}
      </div>

      {children}
    </motion.div>
  )
}
