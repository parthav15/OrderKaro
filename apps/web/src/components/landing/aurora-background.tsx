"use client"

import { motion, useReducedMotion } from "framer-motion"

interface AuroraBackgroundProps {
  className?: string
}

export function AuroraBackground({ className = "" }: AuroraBackgroundProps) {
  const reduceMotion = useReducedMotion()

  return (
    <div className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}>
      <motion.div
        animate={
          reduceMotion
            ? undefined
            : { x: [0, 60, -30, 0], y: [0, -50, 30, 0], scale: [1, 1.15, 0.95, 1] }
        }
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-40 -left-32 h-[32rem] w-[32rem] rounded-full bg-primary/20 blur-[120px]"
      />
      <motion.div
        animate={
          reduceMotion
            ? undefined
            : { x: [0, -50, 30, 0], y: [0, 50, -20, 0], scale: [1, 0.9, 1.1, 1] }
        }
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 -right-40 h-[36rem] w-[36rem] rounded-full bg-accent/15 blur-[130px]"
      />
      <motion.div
        animate={
          reduceMotion
            ? undefined
            : { x: [0, 30, -30, 0], y: [0, -30, 20, 0] }
        }
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 left-1/4 h-[26rem] w-[26rem] rounded-full bg-primary/10 blur-[110px]"
      />
    </div>
  )
}
