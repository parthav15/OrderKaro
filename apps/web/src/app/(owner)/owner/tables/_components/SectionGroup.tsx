"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

interface SectionGroupProps {
  title: string
  count: number
  selectedCount?: number
  onSelectAll?: () => void
  onClearAll?: () => void
  children: React.ReactNode
}

export function SectionGroup({
  title,
  count,
  selectedCount = 0,
  onSelectAll,
  onClearAll,
  children,
}: SectionGroupProps) {
  const [open, setOpen] = useState(true)
  const allSelected = selectedCount === count && count > 0

  return (
    <motion.section layout className="space-y-4">
      <motion.div
        layout
        className="sticky top-20 z-10 -mx-2 px-2 py-2 backdrop-blur-md bg-surface-elevated/85 flex items-center justify-between"
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 group"
        >
          <motion.span
            animate={{ rotate: open ? 0 : -90 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className="text-muted group-hover:text-ink transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.span>
          <span className="text-[11px] uppercase tracking-[0.22em] font-bold text-ink">
            {title}
          </span>
          <span className="text-[11px] font-semibold tabular-nums text-muted">
            {count}
          </span>
        </button>

        {(onSelectAll || onClearAll) && (
          <button
            type="button"
            onClick={allSelected ? onClearAll : onSelectAll}
            className="text-[10px] uppercase tracking-[0.18em] font-bold text-muted hover:text-brand-red transition-colors"
          >
            {allSelected ? "Clear" : "Select all"}
          </button>
        )}
      </motion.div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
