"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Plus, FileDown, Loader2, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { KpiChips } from "./KpiChips"

interface Restaurant {
  id: string
  name: string
}

interface TablesHeaderProps {
  restaurants: Restaurant[]
  restaurantId: string
  onRestaurantChange: (id: string) => void
  total: number
  active: number
  liveNow: number
  onAdd: () => void
  onBulkDownload: () => void
  bulkExporting: boolean
  hasTables: boolean
}

export function TablesHeader({
  restaurants,
  restaurantId,
  onRestaurantChange,
  total,
  active,
  liveNow,
  onAdd,
  onBulkDownload,
  bulkExporting,
  hasTables,
}: TablesHeaderProps) {
  return (
    <div className="space-y-6 mb-8">
      <div className="flex items-start justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-2"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 text-brand-red" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-neutral-400">
              Operations · Tables
            </p>
          </div>
          <h1 className="text-[44px] leading-[1.05] font-extrabold tracking-tight text-brand-black font-heading">
            Tables &amp; QR codes
          </h1>
          <p className="text-neutral-500 max-w-xl">
            Print, manage and monitor every scannable surface in your restaurant.
            Tap a card to inspect its QR, or hold delete to retire one.
          </p>
        </motion.div>

        <div className="flex items-center gap-3">
          {restaurants.length > 1 && (
            <select
              value={restaurantId}
              onChange={(e) => onRestaurantChange(e.target.value)}
              className="px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-brand-red bg-white"
            >
              {restaurants.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -1 }}
            onClick={onBulkDownload}
            disabled={bulkExporting || !restaurantId || !hasTables}
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold rounded-xl bg-white text-brand-black border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <AnimatePresence mode="wait" initial={false}>
              {bulkExporting ? (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating…
                </motion.span>
              ) : (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <FileDown className="w-4 h-4" /> Export PDF
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <Button size="lg" onClick={onAdd}>
            <Plus className="w-5 h-5" /> Add table
          </Button>
        </div>
      </div>

      <KpiChips total={total} active={active} liveNow={liveNow} />
    </div>
  )
}
