"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuantityStepperProps {
  value: number
  onIncrement: () => void
  onDecrement: () => void
  variant?: "compact" | "comfortable" | "inverted"
  disabled?: boolean
  className?: string
}

const variants = {
  compact: {
    wrapper: "h-9 px-1 gap-1 rounded-full bg-brand-black text-white",
    button: "w-7 h-7",
    value: "text-sm font-bold min-w-[18px]",
    icon: 14,
  },
  comfortable: {
    wrapper: "h-12 px-1.5 gap-1 rounded-full bg-brand-black text-white",
    button: "w-9 h-9",
    value: "text-base font-bold min-w-[24px]",
    icon: 18,
  },
  inverted: {
    wrapper: "h-9 px-1 gap-1 rounded-full bg-white text-brand-black border border-brand-black/15",
    button: "w-7 h-7",
    value: "text-sm font-bold min-w-[18px]",
    icon: 14,
  },
}

export function QuantityStepper({
  value,
  onIncrement,
  onDecrement,
  variant = "compact",
  disabled,
  className,
}: QuantityStepperProps) {
  const v = variants[variant]

  return (
    <div
      className={cn(
        "inline-flex items-center justify-between select-none",
        v.wrapper,
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      <motion.button
        type="button"
        whileTap={{ scale: 0.86 }}
        whileHover={{ scale: 1.06 }}
        onClick={(e) => {
          e.stopPropagation()
          onDecrement()
        }}
        className={cn("flex items-center justify-center rounded-full", v.button)}
        aria-label="Decrease quantity"
      >
        <Minus size={v.icon} strokeWidth={2.5} />
      </motion.button>

      <div className={cn("text-center tabular-nums", v.value)}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            initial={{ y: 6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -6, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="inline-block"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>

      <motion.button
        type="button"
        whileTap={{ scale: 0.86 }}
        whileHover={{ scale: 1.06 }}
        onClick={(e) => {
          e.stopPropagation()
          onIncrement()
        }}
        className={cn("flex items-center justify-center rounded-full", v.button)}
        aria-label="Increase quantity"
      >
        <Plus size={v.icon} strokeWidth={2.5} />
      </motion.button>
    </div>
  )
}
