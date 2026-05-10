"use client"

import { motion } from "framer-motion"
import { Pencil, Eye } from "lucide-react"
import type { MapMode } from "../../_hooks/useUrlState"

interface ModeToggleProps {
  mode: MapMode
  onChange: (mode: MapMode) => void
  snap: boolean
  onSnapChange: (snap: boolean) => void
}

export function ModeToggle({ mode, onChange, snap, onSnapChange }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/95 backdrop-blur-md border border-neutral-200 shadow-sm">
        <ToggleSegment
          active={mode === "operations"}
          onClick={() => onChange("operations")}
          icon={<Eye className="w-3.5 h-3.5" />}
          label="Operations"
        />
        <ToggleSegment
          active={mode === "edit"}
          onClick={() => onChange("edit")}
          icon={<Pencil className="w-3.5 h-3.5" />}
          label="Edit"
        />
      </div>

      {mode === "edit" && (
        <motion.button
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSnapChange(!snap)}
          className={
            "px-3 py-2 rounded-2xl text-[11px] uppercase tracking-[0.18em] font-bold transition-colors " +
            (snap
              ? "bg-brand-red text-white"
              : "bg-white border border-neutral-200 text-neutral-500 hover:text-brand-black")
          }
        >
          Snap
        </motion.button>
      )}
    </div>
  )
}

function ToggleSegment({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors " +
        (active ? "text-white" : "text-neutral-500 hover:text-brand-black")
      }
    >
      {active && (
        <motion.span
          layoutId="mode-toggle-pill"
          className="absolute inset-0 rounded-xl bg-brand-black"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
    </button>
  )
}
