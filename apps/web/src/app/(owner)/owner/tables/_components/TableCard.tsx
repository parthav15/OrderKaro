"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Download, Eye, Pencil, Loader2, Check } from "lucide-react"
import type { TableRow } from "../_hooks/useTablesQuery"
import { TableCardQrThumb } from "./TableCardQrThumb"
import { StatusDot } from "./StatusDot"
import { HoldToConfirm } from "./HoldToConfirm"
import { relativeAge } from "../_utils/format-time"

interface TableCardProps {
  table: TableRow
  restaurantId: string
  selected: boolean
  selectionMode: boolean
  onToggleSelect: (id: string, shiftKey: boolean) => void
  onView: (table: TableRow) => void
  onEdit: (table: TableRow) => void
  onDownload: (table: TableRow) => void
  onDelete: (table: TableRow) => void
  isDownloading: boolean
  pulseAt?: number
  liveActiveCount?: number
}

export function TableCard({
  table,
  restaurantId,
  selected,
  selectionMode,
  onToggleSelect,
  onView,
  onEdit,
  onDownload,
  onDelete,
  isDownloading,
  pulseAt,
  liveActiveCount,
}: TableCardProps) {
  const [hovered, setHovered] = useState(false)
  const [haloKey, setHaloKey] = useState(0)

  useEffect(() => {
    if (pulseAt) setHaloKey((k) => k + 1)
  }, [pulseAt])

  const liveCount = liveActiveCount ?? table.activeOrderCount
  const isLive = liveCount > 0

  return (
    <motion.div
      layout
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="relative"
    >
      <AnimatePresence>
        {haloKey > 0 && (
          <motion.div
            key={haloKey}
            initial={{ opacity: 0.6, scale: 0.96 }}
            animate={{ opacity: 0, scale: 1.04 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute inset-0 rounded-2xl ring-2 ring-brand-red pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div
        className={
          "relative rounded-2xl bg-surface transition-colors " +
          (selected
            ? "ring-2 ring-brand-red border border-transparent"
            : hovered
            ? "border border-brand-red/30 shadow-[0_4px_24px_-12px_rgba(var(--brand-red)/0.18)]"
            : "border border-line")
        }
      >
        {!table.isActive && (
          <div
            aria-hidden
            className="absolute inset-0 rounded-2xl pointer-events-none opacity-30"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, transparent 0 7px, rgba(var(--ink) / 0.04) 7px 8px)",
            }}
          />
        )}

        <button
          type="button"
          aria-label={selected ? "Deselect" : "Select"}
          onClick={(e) => onToggleSelect(table.id, e.shiftKey)}
          className={
            "absolute top-3 left-3 w-5 h-5 rounded-md border transition-all " +
            (selected
              ? "bg-brand-red border-brand-red flex items-center justify-center"
              : selectionMode
              ? "bg-surface border-line hover:border-brand-red"
              : "bg-surface/80 border-line opacity-0 group-hover:opacity-100 hover:border-brand-red")
          }
          style={{ opacity: selected || selectionMode || hovered ? 1 : 0 }}
        >
          {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </button>

        <div className={`px-5 pt-5 pb-4 ${!table.isActive ? "opacity-60" : ""}`}>
          <div className="flex items-start gap-4">
            <TableCardQrThumb
              restaurantId={restaurantId}
              tableId={table.id}
              hovered={hovered}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-muted truncate">
                  {table.section || "Unassigned"} · {relativeAge(table.createdAt)}
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-ink font-heading tracking-tight leading-none truncate">
                {table.label}
              </h3>
              <div className="mt-3 flex items-center gap-3">
                <StatusDot active={isLive} />
                <span className="text-xs font-semibold text-muted tabular-nums">
                  {isLive ? `${liveCount} active` : "Idle"}
                </span>
                <span className="text-muted/50">·</span>
                <span className="text-xs text-muted tabular-nums">
                  <span className="font-bold text-ink">{table.todayOrderCount}</span> today
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 px-4 pb-4 ${!table.isActive ? "opacity-60" : ""}`}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onDownload(table)}
            disabled={isDownloading}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-ink text-canvas text-xs font-bold hover:opacity-90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isDownloading ? (
                <motion.span
                  key="dl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving
                </motion.span>
              ) : (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => onView(table)}
            aria-label="View QR"
            className="w-9 h-9 inline-flex items-center justify-center rounded-xl border border-line text-ink hover:border-line hover:bg-surface-elevated transition-colors"
          >
            <Eye className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => onEdit(table)}
            aria-label="Edit table"
            className="w-9 h-9 inline-flex items-center justify-center rounded-xl border border-line text-ink hover:border-line hover:bg-surface-elevated transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </motion.button>

          <HoldToConfirm onConfirm={() => onDelete(table)} ariaLabel={`Hold to delete ${table.label}`} />
        </div>
      </div>
    </motion.div>
  )
}
