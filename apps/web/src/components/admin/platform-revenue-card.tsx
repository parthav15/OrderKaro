"use client"

import { useEffect, useState } from "react"
import { motion, useMotionValue, animate } from "framer-motion"
import { Gem } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe"

function PlatformRevenueAmount({ value }: { value: number }) {
  const reduceMotion = useReducedMotionSafe()
  const motionValue = useMotionValue(0)
  const [display, setDisplay] = useState(() => formatPrice(reduceMotion ? value : 0))

  useEffect(() => {
    if (reduceMotion) {
      motionValue.set(value)
      setDisplay(formatPrice(value))
      return
    }
    const controls = animate(motionValue, value, { duration: 1.3, ease: [0.16, 1, 0.3, 1] })
    const unsubscribe = motionValue.on("change", (latest) => setDisplay(formatPrice(Math.max(0, latest))))
    return () => {
      controls.stop()
      unsubscribe()
    }
  }, [value, reduceMotion, motionValue])

  return (
    <span className="font-heading text-4xl font-extrabold tabular-nums text-accent sm:text-5xl lg:text-6xl">
      {display}
    </span>
  )
}

interface PlatformRevenueCardProps {
  value: number
  loading: boolean
}

export function PlatformRevenueCard({ value, loading }: PlatformRevenueCardProps) {
  const reduceMotion = useReducedMotionSafe()

  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-md"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-accent/15 blur-3xl"
      />
      <div className="relative flex flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-9 sm:py-10">
        <div className="max-w-sm">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
            <Gem className="h-3 w-3" />
            Platform Revenue
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Your margin across every marketplace order, on every restaurant &mdash; excludes subscription billing.
          </p>
        </div>
        <div className="shrink-0 sm:text-right">
          {loading ? (
            <div className="h-11 w-44 animate-pulse rounded-xl bg-surface-elevated sm:ml-auto" />
          ) : (
            <PlatformRevenueAmount value={value} />
          )}
        </div>
      </div>
    </motion.div>
  )
}
