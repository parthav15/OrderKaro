"use client"

import { useCallback, useEffect, useRef } from "react"
import { useMotionValue, animate } from "framer-motion"
import { MAX_SCALE, MIN_SCALE, FIT_PADDING, type Bounds } from "../../_utils/map/bounds"

interface UseCanvasTransformOptions {
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function useCanvasTransform({ containerRef }: UseCanvasTransformOptions) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useMotionValue(1)
  const isPanningRef = useRef(false)
  const spaceDownRef = useRef(false)
  const panStartRef = useRef({ x: 0, y: 0, originX: 0, originY: 0 })

  const setScaleAtPoint = useCallback(
    (nextScale: number, originX: number, originY: number) => {
      const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, nextScale))
      const currentScale = scale.get()
      if (clamped === currentScale) return
      const currentX = x.get()
      const currentY = y.get()
      const ratio = clamped / currentScale
      const nextX = originX - (originX - currentX) * ratio
      const nextY = originY - (originY - currentY) * ratio
      scale.set(clamped)
      x.set(nextX)
      y.set(nextY)
    },
    [scale, x, y]
  )

  const zoomBy = useCallback(
    (factor: number) => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = rect.width / 2
      const cy = rect.height / 2
      setScaleAtPoint(scale.get() * factor, cx, cy)
    },
    [scale, setScaleAtPoint, containerRef]
  )

  const setScaleCentered = useCallback(
    (nextScale: number) => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setScaleAtPoint(nextScale, rect.width / 2, rect.height / 2)
    },
    [setScaleAtPoint, containerRef]
  )

  const fitToBounds = useCallback(
    (bounds: Bounds | null, animated = true) => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()

      if (!bounds) {
        if (animated) {
          animate(x, 0, { duration: 0.4, ease: [0.16, 1, 0.3, 1] })
          animate(y, 0, { duration: 0.4, ease: [0.16, 1, 0.3, 1] })
          animate(scale, 1, { duration: 0.4, ease: [0.16, 1, 0.3, 1] })
        } else {
          x.set(0)
          y.set(0)
          scale.set(1)
        }
        return
      }

      const w = bounds.maxX - bounds.minX
      const h = bounds.maxY - bounds.minY
      const availW = rect.width - FIT_PADDING * 2
      const availH = rect.height - FIT_PADDING * 2
      const targetScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, Math.min(availW / w, availH / h, 1))
      )
      const cx = bounds.minX + w / 2
      const cy = bounds.minY + h / 2
      const targetX = rect.width / 2 - cx * targetScale
      const targetY = rect.height / 2 - cy * targetScale

      if (animated) {
        animate(x, targetX, { duration: 0.5, ease: [0.16, 1, 0.3, 1] })
        animate(y, targetY, { duration: 0.5, ease: [0.16, 1, 0.3, 1] })
        animate(scale, targetScale, { duration: 0.5, ease: [0.16, 1, 0.3, 1] })
      } else {
        x.set(targetX)
        y.set(targetY)
        scale.set(targetScale)
      }
    },
    [containerRef, scale, x, y]
  )

  const reset = useCallback(() => {
    setScaleCentered(1)
    animate(x, 0, { duration: 0.4, ease: [0.16, 1, 0.3, 1] })
    animate(y, 0, { duration: 0.4, ease: [0.16, 1, 0.3, 1] })
  }, [setScaleCentered, x, y])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === "Space" && !spaceDownRef.current) {
        const target = e.target as HTMLElement
        if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return
        spaceDownRef.current = true
        if (containerRef.current) containerRef.current.style.cursor = "grab"
        e.preventDefault()
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === "Space") {
        spaceDownRef.current = false
        if (containerRef.current) containerRef.current.style.cursor = ""
      }
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
    }
  }, [containerRef])

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      const el = containerRef.current
      if (!el) return
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const localX = e.clientX - rect.left
      const localY = e.clientY - rect.top
      if (e.ctrlKey || e.metaKey) {
        const factor = Math.exp(-e.deltaY * 0.01)
        setScaleAtPoint(scale.get() * factor, localX, localY)
      } else if (Math.abs(e.deltaY) > 0 || Math.abs(e.deltaX) > 0) {
        x.set(x.get() - e.deltaX)
        y.set(y.get() - e.deltaY)
      }
    },
    [containerRef, scale, setScaleAtPoint, x, y]
  )

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const isPanIntent =
        spaceDownRef.current || e.button === 1 || (e.button === 0 && (e.target as HTMLElement)?.dataset?.canvasBackground === "true")
      if (!isPanIntent) return
      isPanningRef.current = true
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        originX: x.get(),
        originY: y.get(),
      }
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      if (containerRef.current) containerRef.current.style.cursor = "grabbing"
    },
    [containerRef, x, y]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanningRef.current) return
      const dx = e.clientX - panStartRef.current.x
      const dy = e.clientY - panStartRef.current.y
      x.set(panStartRef.current.originX + dx)
      y.set(panStartRef.current.originY + dy)
    },
    [x, y]
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanningRef.current) return
      isPanningRef.current = false
      try {
        ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {}
      if (containerRef.current) {
        containerRef.current.style.cursor = spaceDownRef.current ? "grab" : ""
      }
    },
    [containerRef]
  )

  return {
    x,
    y,
    scale,
    zoomBy,
    setScaleCentered,
    fitToBounds,
    reset,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  }
}
