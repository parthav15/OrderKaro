"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Trash2 } from "lucide-react"

interface HoldToConfirmProps {
  onConfirm: () => void
  durationMs?: number
  ariaLabel?: string
  size?: number
}

export function HoldToConfirm({
  onConfirm,
  durationMs = 800,
  ariaLabel = "Hold to delete",
  size = 36,
}: HoldToConfirmProps) {
  const [holding, setHolding] = useState(false)
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number>(0)
  const completedRef = useRef<boolean>(false)

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    setHolding(false)
    setProgress(0)
    startRef.current = 0
  }

  const tick = (timestamp: number) => {
    if (!startRef.current) startRef.current = timestamp
    const elapsed = timestamp - startRef.current
    const next = Math.min(1, elapsed / durationMs)
    setProgress(next)
    if (next >= 1) {
      if (!completedRef.current) {
        completedRef.current = true
        onConfirm()
      }
      stop()
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const begin = () => {
    completedRef.current = false
    setHolding(true)
    rafRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => () => stop(), [])

  const radius = size / 2 - 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - progress)

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      onPointerDown={(e) => {
        e.preventDefault()
        begin()
      }}
      onPointerUp={stop}
      onPointerLeave={() => holding && stop()}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      aria-label={ariaLabel}
      style={{ width: size, height: size }}
      className="relative inline-flex items-center justify-center rounded-full border border-brand-red/20 text-brand-red hover:bg-primary/10 transition-colors select-none"
    >
      <Trash2 className="w-4 h-4 relative z-10" />
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90 pointer-events-none"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--brand-red))"
          strokeOpacity={holding ? 0.9 : 0}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-opacity 120ms ease-out" }}
        />
      </svg>
    </motion.button>
  )
}
