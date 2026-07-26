"use client"

import { useRef } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Plus, Scan } from "lucide-react"
import { formatPrice, cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { VegMarker } from "./veg-marker"
import { QuantityStepper } from "./quantity-stepper"
import type { MenuItem } from "./types"

interface ItemRowProps {
  item: MenuItem
  number: number
  inlineQuantity: number
  onOpen: (sourceRect: DOMRect | null) => void
  onAdd: (sourceEl: HTMLElement | null) => void
  onIncrement: () => void
  onDecrement: () => void
  onViewAr?: () => void
}

export function ItemRow({
  item,
  number,
  inlineQuantity,
  onOpen,
  onAdd,
  onIncrement,
  onDecrement,
  onViewAr,
}: ItemRowProps) {
  const thumbRef = useRef<HTMLDivElement>(null)

  const hasRequiredCustomizations = item.customizations.some((c) => c.isRequired)
  const hasAnyCustomizations = item.customizations.length > 0
  const numberStr = String(number).padStart(2, "0")

  const editorialTags = item.tags.filter(Boolean).slice(0, 2)

  function handleRowClick() {
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
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={item.isAvailable ? { x: 2 } : undefined}
      onClick={handleRowClick}
      className={cn(
        "group relative grid grid-cols-[28px_1fr_auto] gap-x-4 sm:gap-x-5 items-start py-5 border-b border-ink/[0.06] last:border-b-0",
        item.isAvailable ? "cursor-pointer" : "opacity-50 pointer-events-none"
      )}
    >
      <div className="pt-[3px]">
        <span className="font-mono text-[11px] tracking-[0.05em] text-ink/35 group-hover:text-ink/70 transition-colors tabular-nums">
          {numberStr}
        </span>
      </div>

      <div className="min-w-0">
        <div className="flex items-baseline gap-3">
          <h3 className="font-heading text-[17px] sm:text-lg font-semibold text-ink tracking-tight leading-tight">
            {item.name}
          </h3>
          <span className="leader-dots hidden sm:block" />
          <span className="hidden sm:block font-heading text-[17px] sm:text-lg font-extrabold text-ink tabular-nums whitespace-nowrap">
            {formatPrice(item.price)}
          </span>
        </div>

        {item.description && (
          <p className="font-serif italic text-[15px] leading-snug text-ink/55 mt-1.5 line-clamp-2 max-w-[44ch]">
            {item.description}
          </p>
        )}

        <div className="flex items-center gap-2.5 mt-3 flex-wrap">
          <span className="flex items-center gap-1.5">
            <VegMarker isVeg={item.isVeg} size="sm" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/40">
              {item.isVeg ? "Veg" : "Non-veg"}
            </span>
          </span>

          {editorialTags.map((tag) => (
            <Badge key={tag} variant="editorial">
              {tag}
            </Badge>
          ))}

          <span className="sm:hidden font-heading text-[15px] font-extrabold text-ink tabular-nums ml-auto">
            {formatPrice(item.price)}
          </span>
        </div>
      </div>

      <div ref={thumbRef} className="flex flex-col items-end gap-2 self-stretch justify-between min-w-[80px]">
        {item.imageUrl ? (
          <div className="relative w-[88px] h-[88px] sm:w-[96px] sm:h-[96px] rounded-2xl overflow-hidden bg-ink/[0.04]">
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="96px"
              className="object-cover"
            />
            {!item.isAvailable && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-black/55">
                  Sold out
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="w-[88px] h-[88px] sm:w-[96px] sm:h-[96px] rounded-2xl bg-ink/[0.04] flex items-center justify-center">
            <span className="font-serif italic text-2xl text-ink/25">
              {item.name.charAt(0)}
            </span>
          </div>
        )}

        <div className="w-full flex justify-end items-center gap-2">
          {onViewAr && item.isAvailable && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              whileHover={{ y: -1 }}
              onClick={(e) => {
                e.stopPropagation()
                onViewAr()
              }}
              className="inline-flex items-center gap-1 px-2.5 h-9 rounded-full border border-brand-red text-brand-red text-[10px] font-bold uppercase tracking-[0.14em] hover:bg-brand-red hover:text-white transition-colors"
              aria-label={`View ${item.name} on your table in AR`}
            >
              <Scan size={13} strokeWidth={2.6} />
              AR
            </motion.button>
          )}
          {!item.isAvailable ? (
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/40">
              Unavailable
            </span>
          ) : inlineQuantity > 0 ? (
            <QuantityStepper
              value={inlineQuantity}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              variant="compact"
            />
          ) : (
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              whileHover={{ y: -1 }}
              onClick={handleAddClick}
              className="inline-flex items-center gap-1 px-3 h-9 rounded-full border border-ink text-ink text-xs font-bold uppercase tracking-[0.14em] hover:bg-ink hover:text-canvas transition-colors"
            >
              <Plus size={14} strokeWidth={2.6} />
              Add
              {hasAnyCustomizations && !hasRequiredCustomizations && (
                <span className="text-[9px] font-bold opacity-60 ml-0.5">+</span>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.article>
  )
}
