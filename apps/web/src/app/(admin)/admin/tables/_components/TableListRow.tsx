"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Download, Eye, Pencil, Loader2, Check } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"
import type { TableRow } from "../_hooks/useTablesQuery"
import { TableCardQrThumb } from "./TableCardQrThumb"
import { StatusDot } from "./StatusDot"
import { HoldToConfirm } from "./HoldToConfirm"
import { relativeAge } from "../_utils/format-time"

interface TableListRowProps {
  table: TableRow
  canteenId: string
  selected: boolean
  onToggleSelect: (id: string, shiftKey: boolean) => void
  onView: (table: TableRow) => void
  onEdit: (table: TableRow) => void
  onDownload: (table: TableRow) => void
  onDelete: (table: TableRow) => void
  isDownloading: boolean
  liveActiveCount?: number
  pulseAt?: number
}

export function TableListRow({
  table,
  canteenId,
  selected,
  onToggleSelect,
  onView,
  onEdit,
  onDownload,
  onDelete,
  isDownloading,
  liveActiveCount,
  pulseAt,
}: TableListRowProps) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [draftLabel, setDraftLabel] = useState(table.label)

  const renameMutation = useMutation({
    mutationFn: (label: string) =>
      api.put(`/api/v1/canteens/${canteenId}/tables/${table.id}`, { label }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables", canteenId] })
      toast.success("Renamed")
      setEditing(false)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Rename failed")
      setDraftLabel(table.label)
      setEditing(false)
    },
  })

  const liveCount = liveActiveCount ?? table.activeOrderCount
  const isLive = liveCount > 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={
        "group grid grid-cols-[24px_60px_1fr_140px_120px_140px_180px] items-center gap-4 px-4 py-3 rounded-xl transition-colors " +
        (selected ? "bg-brand-red/5" : "hover:bg-neutral-50")
      }
    >
      <button
        type="button"
        aria-label={selected ? "Deselect" : "Select"}
        onClick={(e) => onToggleSelect(table.id, e.shiftKey)}
        className={
          "w-5 h-5 rounded-md border flex items-center justify-center transition-colors " +
          (selected
            ? "bg-brand-red border-brand-red"
            : "bg-white border-neutral-300 hover:border-brand-red")
        }
      >
        {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </button>

      <TableCardQrThumb canteenId={canteenId} tableId={table.id} size={48} />

      <div className="min-w-0">
        <AnimatePresence mode="wait" initial={false}>
          {editing ? (
            <motion.input
              key="edit"
              autoFocus
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              onBlur={() => {
                if (draftLabel.trim() && draftLabel.trim() !== table.label) {
                  renameMutation.mutate(draftLabel.trim())
                } else {
                  setDraftLabel(table.label)
                  setEditing(false)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  ;(e.target as HTMLInputElement).blur()
                }
                if (e.key === "Escape") {
                  setDraftLabel(table.label)
                  setEditing(false)
                }
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full px-2 py-1 -mx-2 rounded-lg border border-brand-red/40 bg-white text-base font-bold text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-red/20"
            />
          ) : (
            <motion.button
              key="label"
              type="button"
              onDoubleClick={() => setEditing(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-left text-base font-bold text-brand-black truncate hover:text-brand-red transition-colors"
              title="Double-click to rename"
            >
              {table.label}
            </motion.button>
          )}
        </AnimatePresence>
        <div className="text-xs text-neutral-500 mt-0.5">
          {table.section || "Unassigned"} · {relativeAge(table.createdAt)}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <StatusDot active={isLive} />
        <span className="text-sm font-semibold text-neutral-700 tabular-nums">
          {isLive ? `${liveCount} active` : "Idle"}
        </span>
      </div>

      <span className="text-sm tabular-nums text-neutral-700">
        <span className="font-bold text-brand-black">{table.todayOrderCount}</span>{" "}
        <span className="text-neutral-400">today</span>
      </span>

      <span
        className={
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.18em] font-bold w-fit " +
          (table.isActive
            ? "bg-neutral-100 text-neutral-600"
            : "bg-neutral-100 text-neutral-400 line-through")
        }
      >
        {table.isActive ? "Live" : "Inactive"}
      </span>

      <div className="flex items-center gap-1.5 justify-end">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => onDownload(table)}
          disabled={isDownloading}
          aria-label="Download QR"
          className="w-9 h-9 rounded-xl border border-neutral-200 inline-flex items-center justify-center text-brand-black hover:border-neutral-300 hover:bg-neutral-50 transition-colors disabled:opacity-50"
        >
          {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => onView(table)}
          aria-label="View QR"
          className="w-9 h-9 rounded-xl border border-neutral-200 inline-flex items-center justify-center text-brand-black hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
        >
          <Eye className="w-4 h-4" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => onEdit(table)}
          aria-label="Edit"
          className="w-9 h-9 rounded-xl border border-neutral-200 inline-flex items-center justify-center text-brand-black hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </motion.button>
        <HoldToConfirm onConfirm={() => onDelete(table)} ariaLabel={`Hold to delete ${table.label}`} />
      </div>
    </motion.div>
  )
}
