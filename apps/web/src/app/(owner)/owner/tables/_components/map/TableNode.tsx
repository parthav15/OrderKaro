"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence, type MotionValue, type PanInfo } from "framer-motion"
import { Check } from "lucide-react"
import type { TableRow } from "../../_hooks/useTablesQuery"
import { TableCardQrThumb } from "../TableCardQrThumb"
import { NODE_HEIGHT, NODE_WIDTH, snapToGrid } from "../../_utils/map/bounds"

interface TableNodeProps {
  table: TableRow
  restaurantId: string
  scale: MotionValue<number>
  draggable: boolean
  selected: boolean
  snap: boolean
  liveActiveCount?: number
  pulseAt?: number
  onPositionChange: (id: string, posX: number, posY: number) => void
  onSelect: (id: string, additive: boolean) => void
}

export function TableNode({
  table,
  restaurantId,
  scale,
  draggable,
  selected,
  snap,
  liveActiveCount,
  pulseAt,
  onPositionChange,
  onSelect,
}: TableNodeProps) {
  const [hovered, setHovered] = useState(false)
  const [haloKey, setHaloKey] = useState(0)
  const dragStartRef = useRef<{ posX: number; posY: number; pointer: { x: number; y: number } } | null>(null)

  useEffect(() => {
    if (pulseAt) setHaloKey((k) => k + 1)
  }, [pulseAt])

  const liveCount = liveActiveCount ?? table.activeOrderCount
  const isLive = liveCount > 0
  const isReady = false

  const posX = table.posX ?? 0
  const posY = table.posY ?? 0

  function onDragStart(_e: any, info: PanInfo) {
    dragStartRef.current = {
      posX,
      posY,
      pointer: { x: info.point.x, y: info.point.y },
    }
  }

  function onDrag(_e: any, info: PanInfo) {
    if (!dragStartRef.current) return
    const s = scale.get()
    const dx = (info.point.x - dragStartRef.current.pointer.x) / s
    const dy = (info.point.y - dragStartRef.current.pointer.y) / s
    let nextX = dragStartRef.current.posX + dx
    let nextY = dragStartRef.current.posY + dy
    if (snap) {
      nextX = snapToGrid(nextX)
      nextY = snapToGrid(nextY)
    }
    onPositionChange(table.id, nextX, nextY)
  }

  function onDragEnd(_e: any, info: PanInfo) {
    if (!dragStartRef.current) return
    const s = scale.get()
    const dx = (info.point.x - dragStartRef.current.pointer.x) / s
    const dy = (info.point.y - dragStartRef.current.pointer.y) / s
    let nextX = dragStartRef.current.posX + dx
    let nextY = dragStartRef.current.posY + dy
    if (snap) {
      nextX = snapToGrid(nextX)
      nextY = snapToGrid(nextY)
    }
    onPositionChange(table.id, nextX, nextY)
    dragStartRef.current = null
  }

  return (
    <motion.div
      layout="position"
      style={{ position: "absolute", left: posX, top: posY, width: NODE_WIDTH, height: NODE_HEIGHT, cursor: draggable ? "grab" : "pointer" }}
      drag={draggable}
      dragMomentum={false}
      dragElastic={0}
      dragSnapToOrigin={false}
      whileDrag={{ scale: 1.04, zIndex: 10, cursor: "grabbing" }}
      onDragStart={onDragStart}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(table.id, e.shiftKey || e.metaKey || e.ctrlKey)
      }}
      transition={{ type: "spring", stiffness: 360, damping: 28 }}
    >
      <AnimatePresence>
        {haloKey > 0 && (
          <motion.div
            key={haloKey}
            initial={{ opacity: 0.6, scale: 0.95 }}
            animate={{ opacity: 0, scale: 1.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute inset-0 rounded-2xl ring-2 ring-brand-red pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div
        className={
          "relative w-full h-full rounded-2xl bg-surface p-3 select-none transition-colors " +
          (selected
            ? "ring-2 ring-brand-red border border-transparent shadow-[0_8px_24px_-12px_rgba(var(--brand-red)/0.45)]"
            : hovered
            ? "border border-brand-red/40 shadow-[0_8px_20px_-12px_rgba(0,0,0,0.18)]"
            : "border border-line shadow-[0_2px_8px_-4px_rgba(0,0,0,0.08)]")
        }
      >
        {!table.isActive && (
          <div
            aria-hidden
            className="absolute inset-0 rounded-2xl pointer-events-none opacity-40"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, transparent 0 7px, rgba(var(--ink) / 0.05) 7px 8px)",
            }}
          />
        )}

        <div className="flex items-start gap-2.5">
          <TableCardQrThumb restaurantId={restaurantId} tableId={table.id} size={56} hovered={hovered} />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-extrabold text-ink leading-tight truncate">
              {table.label}
            </h4>
            {table.section && (
              <p className="text-[9px] uppercase tracking-[0.18em] font-bold text-muted mt-0.5 truncate">
                {table.section}
              </p>
            )}
          </div>
        </div>

        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="relative flex items-center justify-center">
              <span
                className={
                  isLive
                    ? "w-2 h-2 rounded-full bg-brand-red"
                    : "w-2 h-2 rounded-full bg-muted"
                }
              />
              {isLive && (
                <span className="absolute inset-0 rounded-full bg-brand-red animate-ping opacity-60" />
              )}
            </span>
            <span className="text-[10px] font-bold tabular-nums text-muted">
              {isLive ? `${liveCount} active` : "Idle"}
            </span>
          </div>
          {table.todayOrderCount > 0 && (
            <span className="text-[10px] tabular-nums text-muted">
              <span className="font-bold text-ink">{table.todayOrderCount}</span> today
            </span>
          )}
        </div>

        {selected && (
          <div className="absolute -top-2 -left-2 w-5 h-5 rounded-md bg-brand-red flex items-center justify-center">
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
        )}
      </div>
    </motion.div>
  )
}
