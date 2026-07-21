"use client"

import { motion, type MotionValue } from "framer-motion"

interface CanvasViewportProps {
  x: MotionValue<number>
  y: MotionValue<number>
  scale: MotionValue<number>
  containerRef: React.RefObject<HTMLDivElement | null>
  onWheel: (e: React.WheelEvent) => void
  onPointerDown: (e: React.PointerEvent) => void
  onPointerMove: (e: React.PointerEvent) => void
  onPointerUp: (e: React.PointerEvent) => void
  onBackgroundClick?: () => void
  children: React.ReactNode
  background: React.ReactNode
}

export function CanvasViewport({
  x,
  y,
  scale,
  containerRef,
  onWheel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onBackgroundClick,
  children,
  background,
}: CanvasViewportProps) {
  return (
    <div
      ref={containerRef}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={(e) => {
        if ((e.target as HTMLElement)?.dataset?.canvasBackground === "true") {
          onBackgroundClick?.()
        }
      }}
      data-canvas-background="true"
      className="relative w-full h-full overflow-hidden bg-neutral-50 rounded-3xl border border-neutral-100"
      style={{ touchAction: "none" }}
    >
      {background}

      <motion.div
        data-canvas-background="true"
        style={{
          x,
          y,
          scale,
          transformOrigin: "0 0",
          position: "absolute",
          left: 0,
          top: 0,
          width: 1,
          height: 1,
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}
