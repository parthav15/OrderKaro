"use client"

import { motion, useTransform, type MotionValue } from "framer-motion"
import { GRID_SIZE } from "../../_utils/map/bounds"

interface CanvasGridProps {
  x: MotionValue<number>
  y: MotionValue<number>
  scale: MotionValue<number>
}

export function CanvasGrid({ x, y, scale }: CanvasGridProps) {
  const backgroundSize = useTransform(scale, (s) => `${GRID_SIZE * s}px ${GRID_SIZE * s}px`)
  const backgroundPosition = useTransform([x, y, scale], (vals) => {
    const [vx, vy, vs] = vals as [number, number, number]
    const px = vx % (GRID_SIZE * vs)
    const py = vy % (GRID_SIZE * vs)
    return `${px}px ${py}px`
  })
  const opacity = useTransform(scale, [0.4, 0.7, 1.5, 3], [0, 0.5, 0.8, 0.4])

  return (
    <motion.div
      data-canvas-background="true"
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(var(--ink) / 0.18) 1px, transparent 0)",
        backgroundSize,
        backgroundPosition,
        opacity,
      }}
    />
  )
}
