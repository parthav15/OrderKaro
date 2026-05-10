"use client"

import { useRef, useState } from "react"
import { motion, AnimatePresence, type MotionValue } from "framer-motion"
import { ChevronUp, ChevronDown } from "lucide-react"
import type { TableRow } from "../../_hooks/useTablesQuery"
import { TableCardQrThumb } from "../TableCardQrThumb"
import { snapToGrid } from "../../_utils/map/bounds"

interface UnplacedTrayProps {
  tables: TableRow[]
  canteenId: string
  canvasRef: React.RefObject<HTMLDivElement>
  x: MotionValue<number>
  y: MotionValue<number>
  scale: MotionValue<number>
  draggable: boolean
  snap: boolean
  onPlace: (id: string, posX: number, posY: number) => void
}

export function UnplacedTray({
  tables,
  canteenId,
  canvasRef,
  x,
  y,
  scale,
  draggable,
  snap,
  onPlace,
}: UnplacedTrayProps) {
  const [open, setOpen] = useState(true)
  if (tables.length === 0) return null

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
      className="absolute bottom-4 left-4 right-4 z-20 max-w-3xl mx-auto"
    >
      <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-neutral-200 shadow-lg">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5"
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-brand-red">
              Unplaced
            </span>
            <span className="text-xs tabular-nums font-bold text-brand-black">
              {tables.length}
            </span>
            <span className="text-[10px] text-neutral-400 font-medium hidden sm:inline">
              {draggable ? "Drag onto canvas to place" : "Switch to Edit mode to place"}
            </span>
          </div>
          {open ? (
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-neutral-400" />
          )}
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 px-3 py-3 overflow-x-auto">
                {tables.map((t) => (
                  <UnplacedItem
                    key={t.id}
                    table={t}
                    canteenId={canteenId}
                    canvasRef={canvasRef}
                    x={x}
                    y={y}
                    scale={scale}
                    draggable={draggable}
                    snap={snap}
                    onPlace={onPlace}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function UnplacedItem({
  table,
  canteenId,
  canvasRef,
  x,
  y,
  scale,
  draggable,
  snap,
  onPlace,
}: {
  table: TableRow
  canteenId: string
  canvasRef: React.RefObject<HTMLDivElement>
  x: MotionValue<number>
  y: MotionValue<number>
  scale: MotionValue<number>
  draggable: boolean
  snap: boolean
  onPlace: (id: string, posX: number, posY: number) => void
}) {
  const dragRef = useRef<HTMLDivElement | null>(null)

  return (
    <motion.div
      ref={dragRef}
      drag={draggable}
      dragSnapToOrigin
      dragMomentum={false}
      dragElastic={0}
      whileDrag={{ scale: 1.06, zIndex: 30 }}
      onDragEnd={(_e, info) => {
        const canvasEl = canvasRef.current
        if (!canvasEl) return
        const rect = canvasEl.getBoundingClientRect()
        const localX = info.point.x - rect.left
        const localY = info.point.y - rect.top
        if (
          info.point.x < rect.left ||
          info.point.x > rect.right ||
          info.point.y < rect.top ||
          info.point.y > rect.bottom
        ) {
          return
        }
        const s = scale.get()
        let worldX = (localX - x.get()) / s - 56
        let worldY = (localY - y.get()) / s - 56
        if (snap) {
          worldX = snapToGrid(worldX)
          worldY = snapToGrid(worldY)
        }
        onPlace(table.id, worldX, worldY)
      }}
      className="shrink-0 w-[140px] cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-neutral-200 hover:border-brand-red/40 transition-colors shadow-sm">
        <TableCardQrThumb canteenId={canteenId} tableId={table.id} size={40} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-brand-black truncate">{table.label}</p>
          {table.section && (
            <p className="text-[9px] uppercase tracking-[0.18em] text-neutral-400 truncate">
              {table.section}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
