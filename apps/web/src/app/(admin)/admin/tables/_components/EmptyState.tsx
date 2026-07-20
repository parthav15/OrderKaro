"use client"

import { motion } from "framer-motion"
import { Plus, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  onAdd: () => void
  onBulkAdd: () => void
}

export function EmptyState({ onAdd, onBulkAdd }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl border border-neutral-100 bg-white py-16 px-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-5">
          <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-brand-red">
            Get started
          </p>
          <h2 className="text-4xl font-extrabold text-brand-black font-heading leading-[1.05] tracking-tight">
            Spin up your first
            <br />
            scannable surface.
          </h2>
          <p className="text-neutral-500 max-w-md leading-relaxed">
            A table is the unit of presence in your restaurant. Each one gets a
            unique QR that students scan to order. Add one — or seed twenty in
            a single tap.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button size="lg" onClick={onAdd}>
              <Plus className="w-4 h-4" /> Add your first table
            </Button>
            <Button size="lg" variant="outline" onClick={onBulkAdd}>
              <Layers className="w-4 h-4" /> Quick-create 1–20
            </Button>
          </div>
        </div>

        <div className="relative h-[280px] flex items-center justify-center">
          <FloatingScene />
        </div>
      </div>
    </motion.div>
  )
}

function FloatingScene() {
  return (
    <div className="relative w-full h-full">
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 top-1/2 -translate-x-[60%] -translate-y-[55%] w-44 h-44 rounded-3xl bg-white border border-neutral-100 shadow-[0_24px_48px_-20px_rgba(0,0,0,0.18)]"
      >
        <div className="absolute inset-3 rounded-2xl bg-neutral-50 grid grid-cols-7 grid-rows-7 gap-[2px] p-3">
          {Array.from({ length: 49 }).map((_, i) => {
            const filled = Math.random() > 0.45
            return (
              <span
                key={i}
                className={
                  filled
                    ? "rounded-[1px] bg-brand-black"
                    : "rounded-[1px] bg-transparent"
                }
              />
            )
          })}
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 6, 0], rotate: [-4, -2, -4] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-2 top-6 w-24 h-40 rounded-3xl bg-brand-black shadow-[0_18px_36px_-14px_rgba(0,0,0,0.45)] border-2 border-brand-black/90"
      >
        <div className="absolute inset-1 rounded-[1.4rem] bg-white" />
        <div className="absolute inset-3 rounded-2xl bg-gradient-to-b from-neutral-50 to-white" />
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-8 h-1.5 rounded-full bg-brand-black/80" />
      </motion.div>

      <motion.div
        animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-12 top-20 w-12 h-12 rounded-full bg-brand-red/10 ring-1 ring-brand-red/20 flex items-center justify-center"
      >
        <span className="block w-3 h-3 rounded-full bg-brand-red" />
      </motion.div>
    </div>
  )
}
