"use client"

import { motion } from "framer-motion"
import { ItemHeroCard } from "./item-hero-card"
import type { MenuItem } from "./types"

interface SignatureRailProps {
  items: MenuItem[]
  inlineQuantities: Record<string, number>
  onOpen: (item: MenuItem, sourceRect: DOMRect | null) => void
  onAdd: (item: MenuItem, sourceEl: HTMLElement | null) => void
  onIncrement: (item: MenuItem) => void
  onDecrement: (item: MenuItem) => void
}

export function SignatureRail({
  items,
  inlineQuantities,
  onOpen,
  onAdd,
  onIncrement,
  onDecrement,
}: SignatureRailProps) {
  if (items.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="pt-2 pb-3"
    >
      <div className="px-5 mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-black/45">
            Signature
          </p>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-black leading-tight mt-1.5">
            Today&apos;s picks
          </h2>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-black/40 pb-1.5">
          Swipe →
        </p>
      </div>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x-mandatory px-5 pb-2 mask-fade-x">
        {items.map((item, idx) => (
          <ItemHeroCard
            key={item.id}
            item={item}
            number={idx + 1}
            inlineQuantity={inlineQuantities[item.id] ?? 0}
            onOpen={(rect) => onOpen(item, rect)}
            onAdd={(el) => onAdd(item, el)}
            onIncrement={() => onIncrement(item)}
            onDecrement={() => onDecrement(item)}
          />
        ))}
      </div>
    </motion.section>
  )
}
