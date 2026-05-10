"use client"

import { motion } from "framer-motion"

interface SwitchProps {
  checked: boolean
  onCheckedChange: (next: boolean) => void
  ariaLabel?: string
}

export function Switch({ checked, onCheckedChange, ariaLabel }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onCheckedChange(!checked)}
      className={
        "relative w-12 h-7 rounded-full transition-colors p-0.5 " +
        (checked ? "bg-brand-red" : "bg-neutral-200")
      }
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 700, damping: 30 }}
        className={
          "block w-6 h-6 rounded-full bg-white shadow-sm " +
          (checked ? "ml-5" : "ml-0")
        }
      />
    </button>
  )
}
