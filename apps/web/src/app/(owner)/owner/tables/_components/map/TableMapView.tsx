"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { LayoutGrid, Move } from "lucide-react"
import type { TableRow } from "../../_hooks/useTablesQuery"
import { useTablesUrlState } from "../../_hooks/useUrlState"
import { useTablePositions } from "../../_hooks/map/useTablePositions"
import { useCanvasTransform } from "../../_hooks/map/useCanvasTransform"
import { computeBounds, placedItems, unplacedItems } from "../../_utils/map/bounds"
import { CanvasViewport } from "./CanvasViewport"
import { CanvasGrid } from "./CanvasGrid"
import { TableNode } from "./TableNode"
import { UnplacedTray } from "./UnplacedTray"
import { ZoomControls } from "./ZoomControls"
import { ModeToggle } from "./ModeToggle"
import { FloorTabs } from "./FloorTabs"

interface TableMapViewProps {
  tables: TableRow[]
  restaurantId: string
  activity: Record<string, { pulseAt: number; activeOrderCount: number }>
  onSelectTable: (id: string | null) => void
  selectedTableId: string | null
}

const UNASSIGNED_KEY = "__unassigned__"

export function TableMapView({
  tables,
  restaurantId,
  activity,
  onSelectTable,
  selectedTableId,
}: TableMapViewProps) {
  const { state, update } = useTablesUrlState()
  const containerRef = useRef<HTMLDivElement>(null)
  const transform = useCanvasTransform({ containerRef })
  const positions = useTablePositions(restaurantId)
  const [hasFitOnce, setHasFitOnce] = useState(false)

  const floorTabs = useMemo(() => {
    const counts = new Map<string, number>()
    for (const t of tables) {
      const key = t.section?.trim() || UNASSIGNED_KEY
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    const sorted = Array.from(counts.entries()).sort((a, b) => {
      if (a[0] === UNASSIGNED_KEY) return 1
      if (b[0] === UNASSIGNED_KEY) return -1
      return a[0].localeCompare(b[0], undefined, { numeric: true })
    })
    return sorted.map(([key, count]) => ({
      key,
      label: key === UNASSIGNED_KEY ? "Unassigned" : key,
      count,
    }))
  }, [tables])

  const activeFloor = state.floor ?? floorTabs[0]?.key ?? UNASSIGNED_KEY

  useEffect(() => {
    if (!state.floor && floorTabs[0]) {
      update({ floor: floorTabs[0].key })
    }
  }, [floorTabs, state.floor, update])

  const floorTables = useMemo(() => {
    if (activeFloor === UNASSIGNED_KEY) {
      return tables.filter((t) => !t.section?.trim())
    }
    return tables.filter((t) => (t.section?.trim() ?? "") === activeFloor)
  }, [tables, activeFloor])

  const placed = useMemo(() => placedItems(floorTables), [floorTables])
  const unplaced = useMemo(() => unplacedItems(floorTables), [floorTables])

  useEffect(() => {
    if (hasFitOnce) return
    if (placed.length === 0) return
    const id = requestAnimationFrame(() => {
      const bounds = computeBounds(placed)
      transform.fitToBounds(bounds, false)
      setHasFitOnce(true)
    })
    return () => cancelAnimationFrame(id)
  }, [placed, hasFitOnce, transform])

  useEffect(() => {
    setHasFitOnce(false)
  }, [activeFloor])

  const draggable = state.mapMode === "edit"

  function handleFit() {
    transform.fitToBounds(computeBounds(placed))
  }

  function handlePosition(id: string, posX: number, posY: number) {
    positions.queueSave(id, posX, posY)
  }

  function handleSelect(id: string, additive: boolean) {
    if (additive) return
    onSelectTable(selectedTableId === id ? null : id)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {floorTabs.length > 0 && (
          <FloorTabs
            tabs={floorTabs}
            active={activeFloor}
            onChange={(key) => update({ floor: key })}
          />
        )}
        <ModeToggle
          mode={state.mapMode}
          onChange={(mode) => update({ mapMode: mode })}
          snap={state.snap}
          onSnapChange={(s) => update({ snap: s })}
        />
      </div>

      <div className="relative w-full h-[640px]">
        <CanvasViewport
          x={transform.x}
          y={transform.y}
          scale={transform.scale}
          containerRef={containerRef}
          onWheel={transform.onWheel}
          onPointerDown={transform.onPointerDown}
          onPointerMove={transform.onPointerMove}
          onPointerUp={transform.onPointerUp}
          onBackgroundClick={() => onSelectTable(null)}
          background={
            <CanvasGrid x={transform.x} y={transform.y} scale={transform.scale} />
          }
        >
          {placed.map((t) => (
            <TableNode
              key={t.id}
              table={t}
              restaurantId={restaurantId}
              scale={transform.scale}
              draggable={draggable}
              snap={state.snap}
              selected={selectedTableId === t.id}
              liveActiveCount={activity[t.id]?.activeOrderCount}
              pulseAt={activity[t.id]?.pulseAt}
              onPositionChange={handlePosition}
              onSelect={handleSelect}
            />
          ))}
        </CanvasViewport>

        <AnimatePresence>
          {placed.length === 0 && unplaced.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-surface border border-line flex items-center justify-center">
                  <LayoutGrid className="w-6 h-6 text-muted" />
                </div>
                <p className="text-sm font-bold text-ink">No tables in this floor</p>
                <p className="text-xs text-muted">Add tables, then drag them onto the map.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {placed.length === 0 && unplaced.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-ink/90 text-canvas text-xs font-bold flex items-center gap-2 pointer-events-none"
            >
              <Move className="w-3.5 h-3.5" />
              {state.mapMode === "edit"
                ? "Drag tables from the tray to start placing them"
                : "Switch to Edit to start placing tables"}
            </motion.div>
          )}
        </AnimatePresence>

        <UnplacedTray
          tables={unplaced}
          restaurantId={restaurantId}
          canvasRef={containerRef}
          x={transform.x}
          y={transform.y}
          scale={transform.scale}
          draggable={draggable}
          snap={state.snap}
          onPlace={handlePosition}
        />

        <ZoomControls
          scale={transform.scale}
          onZoomIn={() => transform.zoomBy(1.2)}
          onZoomOut={() => transform.zoomBy(1 / 1.2)}
          onFit={handleFit}
          onReset={transform.reset}
        />
      </div>
    </div>
  )
}
