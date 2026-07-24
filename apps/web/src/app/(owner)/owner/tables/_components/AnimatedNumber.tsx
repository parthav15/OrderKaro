"use client"

import { useEffect, useState } from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"

interface AnimatedNumberProps {
  value: number
  duration?: number
  className?: string
}

export function AnimatedNumber({ value, duration = 0.7, className }: AnimatedNumberProps) {
  const motionValue = useMotionValue(value)
  const rounded = useTransform(motionValue, (n) => Math.round(n).toString())
  const [display, setDisplay] = useState(value.toString())

  useEffect(() => {
    const controls = animate(motionValue, value, { duration, ease: [0.16, 1, 0.3, 1] })
    const unsub = rounded.on("change", (v) => setDisplay(v))
    return () => {
      controls.stop()
      unsub()
    }
  }, [value, duration, motionValue, rounded])

  return (
    <motion.span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {display}
    </motion.span>
  )
}
