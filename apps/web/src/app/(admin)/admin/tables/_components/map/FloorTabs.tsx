"use client"

import { motion } from "framer-motion"

interface FloorTab {
  key: string
  label: string
  count: number
}

interface FloorTabsProps {
  tabs: FloorTab[]
  active: string
  onChange: (key: string) => void
}

export function FloorTabs({ tabs, active, onChange }: FloorTabsProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-2xl bg-surface/95 backdrop-blur-md border border-line shadow-sm">
      {tabs.map((tab) => {
        const isActive = tab.key === active
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={
              "relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors " +
              (isActive
                ? "text-canvas"
                : "text-muted hover:text-ink")
            }
          >
            {isActive && (
              <motion.span
                layoutId="floor-tab-pill"
                className="absolute inset-0 rounded-xl bg-ink"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.label}
              <span
                className={
                  "text-[10px] tabular-nums font-extrabold " +
                  (isActive ? "text-canvas/70" : "text-muted")
                }
              >
                {tab.count}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
