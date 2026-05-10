"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Download, Power, Trash2, X, Loader2 } from "lucide-react"

interface BulkActionBarProps {
  count: number
  onClear: () => void
  onDownload: () => void
  onToggleActive: () => void
  onDelete: () => void
  downloading: boolean
  toggling: boolean
}

export function BulkActionBar({
  count,
  onClear,
  onDownload,
  onToggleActive,
  onDelete,
  downloading,
  toggling,
}: BulkActionBarProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
        >
          <div className="flex items-center gap-2 px-3 py-3 rounded-2xl bg-brand-black/95 backdrop-blur-xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.4)] border border-white/10">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onClear}
              aria-label="Clear selection"
              className="w-10 h-10 inline-flex items-center justify-center rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </motion.button>

            <span className="px-1 text-sm font-bold text-white tabular-nums">
              {count} selected
            </span>

            <span className="w-px h-6 bg-white/10 mx-1" />

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download PDF
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onToggleActive}
              disabled={toggling}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {toggling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
              Toggle active
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onDelete}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-red hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
