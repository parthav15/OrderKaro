"use client"

import { useEffect, useState } from "react"
import { motion, type MotionValue } from "framer-motion"
import { Plus, Minus, Maximize2, RotateCcw } from "lucide-react"

interface ZoomControlsProps {
  scale: MotionValue<number>
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
  onReset: () => void
}

export function ZoomControls({ scale, onZoomIn, onZoomOut, onFit, onReset }: ZoomControlsProps) {
  const [percent, setPercent] = useState(100)

  useEffect(() => {
    const unsub = scale.on("change", (v) => setPercent(Math.round(v * 100)))
    return () => unsub()
  }, [scale])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute bottom-4 right-4 flex items-center gap-1 p-1 rounded-2xl bg-surface/95 backdrop-blur-md border border-line shadow-lg"
    >
      <ZoomBtn onClick={onZoomOut} ariaLabel="Zoom out">
        <Minus className="w-3.5 h-3.5" />
      </ZoomBtn>
      <button
        type="button"
        onClick={onReset}
        className="px-2.5 py-1.5 rounded-xl text-xs font-bold tabular-nums text-ink hover:bg-surface-elevated transition-colors min-w-[52px]"
      >
        {percent}%
      </button>
      <ZoomBtn onClick={onZoomIn} ariaLabel="Zoom in">
        <Plus className="w-3.5 h-3.5" />
      </ZoomBtn>
      <span className="w-px h-5 bg-line mx-0.5" />
      <ZoomBtn onClick={onFit} ariaLabel="Fit to content">
        <Maximize2 className="w-3.5 h-3.5" />
      </ZoomBtn>
      <ZoomBtn onClick={onReset} ariaLabel="Reset view">
        <RotateCcw className="w-3.5 h-3.5" />
      </ZoomBtn>
    </motion.div>
  )
}

function ZoomBtn({
  children,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode
  onClick: () => void
  ariaLabel: string
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-label={ariaLabel}
      className="w-8 h-8 inline-flex items-center justify-center rounded-xl text-ink hover:bg-surface-elevated transition-colors"
    >
      {children}
    </motion.button>
  )
}
