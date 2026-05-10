"use client"

import { motion } from "framer-motion"
import { LayoutGrid, Activity, Radio } from "lucide-react"
import { AnimatedNumber } from "./AnimatedNumber"

interface KpiChipsProps {
  total: number
  active: number
  liveNow: number
}

export function KpiChips({ total, active, liveNow }: KpiChipsProps) {
  const chips = [
    { label: "Total", value: total, icon: LayoutGrid, accent: false },
    { label: "Active", value: active, icon: Activity, accent: false },
    { label: "Live now", value: liveNow, icon: Radio, accent: liveNow > 0 },
  ]

  return (
    <div className="flex items-center gap-2">
      {chips.map((chip, idx) => (
        <motion.div
          key={chip.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * idx, type: "spring", stiffness: 280, damping: 28 }}
          className={
            chip.accent
              ? "flex items-center gap-2 px-4 py-2 rounded-full border border-brand-red/30 bg-brand-red/5 text-brand-red"
              : "flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-200 bg-white text-brand-black"
          }
        >
          <span className="relative flex items-center justify-center">
            <chip.icon className="w-3.5 h-3.5" />
            {chip.accent && (
              <span className="absolute inset-0 -m-1 rounded-full bg-brand-red/20 animate-ping" />
            )}
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-neutral-400">
            {chip.label}
          </span>
          <AnimatedNumber
            value={chip.value}
            className={
              chip.accent
                ? "text-base font-extrabold text-brand-red"
                : "text-base font-extrabold text-brand-black"
            }
          />
        </motion.div>
      ))}
    </div>
  )
}
