"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useFlyToCartStore } from "@/hooks/use-fly-to-cart"
import { VegMarker } from "./veg-marker"

export function FlyToCartLayer() {
  const flights = useFlyToCartStore((s) => s.flights)
  const remove = useFlyToCartStore((s) => s.remove)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || typeof document === "undefined") return null

  return createPortal(
    <div aria-hidden className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
      <AnimatePresence>
        {flights.map((flight) => {
          const targetCenterX = flight.to.x + flight.to.width / 2 - 18
          const targetCenterY = flight.to.y + flight.to.height / 2 - 18
          const peakX = (flight.from.x + targetCenterX) / 2
          const peakY = Math.min(flight.from.y, targetCenterY) - 60

          return (
            <motion.div
              key={flight.id}
              initial={{
                x: flight.from.x,
                y: flight.from.y,
                width: flight.from.width,
                height: flight.from.height,
                opacity: 1,
                rotate: 0,
                scale: 1,
              }}
              animate={{
                x: [flight.from.x, peakX, targetCenterX],
                y: [flight.from.y, peakY, targetCenterY],
                width: [flight.from.width, flight.from.width * 0.6, 36],
                height: [flight.from.height, flight.from.height * 0.6, 36],
                opacity: [1, 0.95, 0.2],
                rotate: [0, 8, 16],
                scale: [1, 0.85, 0.45],
              }}
              transition={{
                duration: 0.65,
                times: [0, 0.55, 1],
                ease: [0.22, 1, 0.36, 1],
              }}
              onAnimationComplete={() => remove(flight.id)}
              className="absolute top-0 left-0 rounded-2xl overflow-hidden bg-brand-black/[0.04] flex items-center justify-center will-change-transform"
              style={{ originX: 0.5, originY: 0.5 }}
            >
              {flight.src ? (
                <Image
                  src={flight.src}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-white">
                  <VegMarker isVeg={flight.isVeg} size="sm" />
                  <span className="font-serif italic text-2xl text-brand-black/40 mt-1">
                    {flight.label.charAt(0)}
                  </span>
                </div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>,
    document.body
  )
}
