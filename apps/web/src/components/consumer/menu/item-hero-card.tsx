"use client"

import { useRef } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Plus } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { VegMarker } from "./veg-marker"
import { QuantityStepper } from "./quantity-stepper"
import type { MenuItem } from "./types"

interface ItemHeroCardProps {
  item: MenuItem
  number: number
  inlineQuantity: number
  onOpen: (sourceRect: DOMRect | null) => void
  onAdd: (sourceEl: HTMLElement | null) => void
  onIncrement: () => void
  onDecrement: () => void
}

export function ItemHeroCard({
  item,
  number,
  inlineQuantity,
  onOpen,
  onAdd,
  onIncrement,
  onDecrement,
}: ItemHeroCardProps) {
  const thumbRef = useRef<HTMLDivElement>(null)

  const hasRequiredCustomizations = item.customizations.some((c) => c.isRequired)
  const numberStr = String(number).padStart(2, "0")

  function handleClick() {
    if (!item.isAvailable) return
    const rect = thumbRef.current?.getBoundingClientRect() ?? null
    onOpen(rect)
  }

  function handleAddClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (!item.isAvailable) return
    if (hasRequiredCustomizations) {
      const rect = thumbRef.current?.getBoundingClientRect() ?? null
      onOpen(rect)
      return
    }
    onAdd(thumbRef.current)
  }

  return (
    <motion.article
      whileHover={item.isAvailable ? { y: -2 } : undefined}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      onClick={handleClick}
      className="snap-start shrink-0 w-[280px] sm:w-[300px] cursor-pointer group"
    >
      <div
        ref={thumbRef}
        className="relative w-full h-[300px] sm:h-[320px] rounded-3xl overflow-hidden bg-ink/[0.05]"
      >
        {item.imageUrl ? (
          <motion.div
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 280px, 300px"
              className="object-cover"
            />
          </motion.div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-serif italic text-7xl text-ink/15">
              {item.name.charAt(0)}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-brand-black/85 via-brand-black/20 to-transparent" />

        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
          <span className="font-mono text-[10px] tracking-[0.18em] text-white/80">
            {numberStr}
          </span>
          <span className="bg-white/95 backdrop-blur rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-brand-black">
            Signature
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <VegMarker isVeg={item.isVeg} size="sm" className="border-white/80" />
            {item.tags[0] && (
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                {item.tags[0]}
              </span>
            )}
          </div>
          <h3 className="font-heading text-2xl font-extrabold tracking-tight leading-tight">
            {item.name}
          </h3>
          {item.description && (
            <p className="font-serif italic text-sm text-white/80 mt-1.5 line-clamp-2">
              {item.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-4">
            <span className="font-heading text-xl font-extrabold tabular-nums">
              {formatPrice(item.price)}
            </span>

            {!item.isAvailable ? (
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                Sold out
              </span>
            ) : inlineQuantity > 0 ? (
              <div onClick={(e) => e.stopPropagation()}>
                <QuantityStepper
                  value={inlineQuantity}
                  onIncrement={onIncrement}
                  onDecrement={onDecrement}
                  variant="inverted"
                />
              </div>
            ) : (
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                whileHover={{ scale: 1.04 }}
                onClick={handleAddClick}
                className="inline-flex items-center gap-1 px-3 h-9 rounded-full bg-white text-brand-black text-xs font-bold uppercase tracking-[0.14em]"
              >
                <Plus size={14} strokeWidth={2.6} />
                Add
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  )
}
