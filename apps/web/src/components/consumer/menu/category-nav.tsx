"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { Category } from "./types"

interface CategoryNavProps {
  categories: Category[]
  activeId: string
  onSelect: (id: string) => void
}

export function CategoryNav({ categories, activeId, onSelect }: CategoryNavProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    const btn = buttonRefs.current[activeId]
    const container = containerRef.current
    if (!btn || !container) return
    const btnRect = btn.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    if (btnRect.left < containerRect.left + 24 || btnRect.right > containerRect.right - 24) {
      btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
    }
  }, [activeId])

  if (categories.length === 0) return null

  return (
    <div
      ref={containerRef}
      className="flex gap-1.5 overflow-x-auto scrollbar-hide mask-fade-x px-5 pb-3"
    >
      {categories.map((cat) => {
        const isActive = activeId === cat.id
        return (
          <button
            key={cat.id}
            ref={(el) => {
              buttonRefs.current[cat.id] = el
            }}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={cn(
              "relative whitespace-nowrap px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.18em] transition-colors",
              isActive ? "text-white" : "text-brand-black/55 hover:text-brand-black"
            )}
          >
            {isActive && (
              <motion.span
                layoutId="activeCategoryPill"
                className="absolute inset-0 bg-brand-black rounded-full"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative">{cat.name}</span>
          </button>
        )
      })}
    </div>
  )
}
