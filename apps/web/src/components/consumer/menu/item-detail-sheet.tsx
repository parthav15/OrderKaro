"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
import { X, Check, Plus, Minus, ChevronRight, Scan } from "lucide-react"
import { formatPrice, cn } from "@/lib/utils"
import { VegMarker } from "./veg-marker"
import { QuantityStepper } from "./quantity-stepper"
import type { MenuItem } from "./types"

interface ItemDetailSheetProps {
  item: MenuItem | null
  number?: number | null
  onClose: () => void
  onAddToCart: (params: {
    item: MenuItem
    quantity: number
    selectedOptions: Record<string, string[]>
  }) => void
  onViewAr?: () => void
}

export function ItemDetailSheet({
  item,
  number,
  onClose,
  onAddToCart,
  onViewAr,
}: ItemDetailSheetProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({})
  const scrollRef = useRef<HTMLDivElement>(null)

  const { scrollY } = useScroll({ container: scrollRef })
  const heroY = useTransform(scrollY, [0, 240], [0, -50])
  const heroScale = useTransform(scrollY, [0, 240], [1, 1.06])

  useEffect(() => {
    if (!item) return
    setQuantity(1)
    const defaults: Record<string, string[]> = {}
    item.customizations.forEach((c) => {
      const def = c.options.filter((o) => o.isDefault).map((o) => o.id)
      if (def.length) defaults[c.id] = def
    })
    setSelectedOptions(defaults)
  }, [item?.id])

  useEffect(() => {
    if (!item) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [item, onClose])

  const liveTotal = useMemo(() => {
    if (!item) return 0
    let unit = Number(item.price)
    for (const cust of item.customizations) {
      const selectedIds = selectedOptions[cust.id] ?? []
      for (const id of selectedIds) {
        const opt = cust.options.find((o) => o.id === id)
        if (opt) unit += Number(opt.priceAdjustment)
      }
    }
    return unit * quantity
  }, [item, selectedOptions, quantity])

  const requiredMissing = useMemo(() => {
    if (!item) return false
    return item.customizations.some(
      (c) => c.isRequired && (selectedOptions[c.id]?.length ?? 0) === 0
    )
  }, [item, selectedOptions])

  function toggleOption(custId: string, optionId: string, type: string) {
    setSelectedOptions((prev) => {
      const current = prev[custId] || []
      if (type === "SINGLE_SELECT") {
        return { ...prev, [custId]: [optionId] }
      }
      if (current.includes(optionId)) {
        return { ...prev, [custId]: current.filter((id) => id !== optionId) }
      }
      return { ...prev, [custId]: [...current, optionId] }
    })
  }

  function handleAdd() {
    if (!item || requiredMissing) return
    onAddToCart({ item, quantity, selectedOptions })
  }

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-brand-black/55 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 140 || info.velocity.y > 600) onClose()
            }}
            className="fixed inset-x-0 bottom-0 z-50 bg-surface rounded-t-[28px] shadow-[0_-20px_60px_-12px_rgba(0,0,0,0.25)] max-h-[92vh] flex flex-col"
          >
            <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 bg-ink/15 rounded-full" />
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="relative h-[260px] sm:h-[300px] overflow-hidden bg-ink/[0.04]">
                {item.imageUrl ? (
                  <motion.div
                    style={{ y: heroY, scale: heroScale }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="100vw"
                      priority
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-transparent to-white/40" />
                  </motion.div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-serif italic text-9xl text-ink/10">
                      {item.name.charAt(0)}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-md hover:scale-105 transition-transform"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-brand-black" strokeWidth={2.4} />
                </button>

                {onViewAr && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={onViewAr}
                    className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-brand-red text-white text-[11px] font-bold uppercase tracking-[0.16em] shadow-lg whitespace-nowrap"
                  >
                    <Scan className="w-4 h-4" strokeWidth={2.4} />
                    View on your table
                  </motion.button>
                )}
              </div>

              <div className="px-6 pt-7 pb-44">
                {number && (
                  <p className="font-mono text-[11px] tracking-[0.18em] text-ink/40 mb-2">
                    {String(number).padStart(2, "0")}
                  </p>
                )}

                <div className="flex items-start gap-3">
                  <VegMarker isVeg={item.isVeg} size="md" className="mt-1.5" />
                  <h2 className="font-heading text-3xl sm:text-[34px] font-extrabold tracking-tight leading-[1.05] text-ink flex-1">
                    {item.name}
                  </h2>
                </div>

                {item.description && (
                  <p className="font-serif italic text-lg leading-snug text-ink/65 mt-3">
                    {item.description}
                  </p>
                )}

                <div className="flex items-baseline gap-3 mt-5">
                  <span className="font-heading text-2xl font-extrabold tabular-nums text-ink">
                    {formatPrice(item.price)}
                  </span>
                  {item.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/55 border border-ink/15 rounded-full px-2 py-[3px]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-7 h-px bg-ink/10" />

                {item.customizations.map((cust, idx) => {
                  const selected = selectedOptions[cust.id] ?? []
                  const isMulti = cust.type === "MULTI_SELECT"
                  return (
                    <motion.section
                      key={cust.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 + idx * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="mt-7"
                    >
                      <div className="flex items-baseline justify-between gap-3 mb-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink/45">
                            {isMulti ? "Choose any" : "Choose one"}
                            {cust.isRequired && <span className="text-brand-red ml-1.5">required</span>}
                          </p>
                          <h3 className="font-heading text-xl font-extrabold text-ink mt-1">
                            {cust.name}
                          </h3>
                        </div>
                      </div>

                      <ul className="space-y-1">
                        {cust.options.map((opt) => {
                          const isSelected = selected.includes(opt.id)
                          const adjustment = Number(opt.priceAdjustment)
                          return (
                            <li key={opt.id}>
                              <button
                                type="button"
                                onClick={() => toggleOption(cust.id, opt.id, cust.type)}
                                className={cn(
                                  "w-full flex items-center justify-between py-3.5 px-1 group transition-colors border-b border-ink/[0.06] last:border-b-0",
                                  isSelected ? "text-ink" : "text-ink/75 hover:text-ink"
                                )}
                              >
                                <div className="flex items-center gap-3.5">
                                  <span
                                    className={cn(
                                      "w-5 h-5 flex items-center justify-center transition-colors flex-shrink-0",
                                      isMulti ? "rounded-md" : "rounded-full",
                                      isSelected
                                        ? "bg-ink text-canvas"
                                        : "border border-ink/25 group-hover:border-ink/55"
                                    )}
                                  >
                                    <AnimatePresence>
                                      {isSelected && (
                                        <motion.span
                                          initial={{ scale: 0, opacity: 0 }}
                                          animate={{ scale: 1, opacity: 1 }}
                                          exit={{ scale: 0, opacity: 0 }}
                                          transition={{ duration: 0.15 }}
                                        >
                                          <Check className="w-3 h-3" strokeWidth={3.5} />
                                        </motion.span>
                                      )}
                                    </AnimatePresence>
                                  </span>
                                  <span
                                    className={cn(
                                      "text-base transition-all",
                                      isSelected ? "font-bold" : "font-medium"
                                    )}
                                  >
                                    {opt.name}
                                  </span>
                                </div>
                                {adjustment > 0 && (
                                  <span
                                    className={cn(
                                      "text-sm tabular-nums transition-colors",
                                      isSelected ? "font-bold text-ink" : "font-medium text-ink/55"
                                    )}
                                  >
                                    +{formatPrice(adjustment)}
                                  </span>
                                )}
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </motion.section>
                  )
                })}

                <motion.section
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18, duration: 0.4 }}
                  className="mt-9 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink/45">
                      Quantity
                    </p>
                    <p className="font-heading text-xl font-extrabold text-ink mt-1">
                      How many?
                    </p>
                  </div>
                  <QuantityStepper
                    value={quantity}
                    onIncrement={() => setQuantity((q) => Math.min(50, q + 1))}
                    onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
                    variant="comfortable"
                  />
                </motion.section>
              </div>
            </div>

            <div className="absolute bottom-0 inset-x-0 bg-surface border-t border-ink/[0.06] px-5 pt-3 pb-4">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                whileHover={{ y: -1 }}
                disabled={requiredMissing}
                onClick={handleAdd}
                className={cn(
                  "w-full h-14 rounded-2xl flex items-center justify-between px-5 transition-colors",
                  requiredMissing
                    ? "bg-ink/10 text-ink/40 cursor-not-allowed"
                    : "bg-ink text-canvas"
                )}
              >
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-75">
                  {requiredMissing ? "Select required options" : "Add to cart"}
                </span>
                <span className="flex items-center gap-2 font-heading text-lg font-extrabold tabular-nums">
                  {formatPrice(liveTotal)}
                  <ChevronRight className="w-5 h-5" strokeWidth={2.4} />
                </span>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
