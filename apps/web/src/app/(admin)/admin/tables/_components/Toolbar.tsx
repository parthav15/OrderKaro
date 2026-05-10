"use client"

import { motion } from "framer-motion"
import { Search, ArrowUpDown, LayoutGrid, Rows3, Map } from "lucide-react"
import type { TablesViewMode, TablesSortMode } from "../_hooks/useUrlState"

interface ToolbarProps {
  query: string
  onQueryChange: (q: string) => void
  sections: string[]
  activeSection: string | null
  onSectionChange: (s: string | null) => void
  sort: TablesSortMode
  onSortChange: (s: TablesSortMode) => void
  view: TablesViewMode
  onViewChange: (v: TablesViewMode) => void
}

const sortLabels: Record<TablesSortMode, string> = {
  natural: "Label A→Z",
  recent: "Recently added",
  active: "Most active today",
}

export function Toolbar({
  query,
  onQueryChange,
  sections,
  activeSection,
  onSectionChange,
  sort,
  onSortChange,
  view,
  onViewChange,
}: ToolbarProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="flex flex-wrap items-center gap-3 mb-8 pb-6 border-b border-neutral-100"
    >
      <div className="relative flex-1 min-w-[260px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search tables…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm placeholder:text-neutral-400 focus:outline-none focus:border-brand-red transition-colors"
        />
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto">
        <SectionPill
          label="All sections"
          active={activeSection === null}
          onClick={() => onSectionChange(null)}
        />
        {sections.map((s) => (
          <SectionPill
            key={s}
            label={s}
            active={activeSection === s}
            onClick={() => onSectionChange(s)}
          />
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as TablesSortMode)}
            className="appearance-none pl-9 pr-8 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-brand-black focus:outline-none focus:border-brand-red"
          >
            {(Object.keys(sortLabels) as TablesSortMode[]).map((k) => (
              <option key={k} value={k}>
                {sortLabels[k]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center p-1 bg-neutral-100 rounded-xl">
          <ViewToggleButton
            active={view === "grid"}
            onClick={() => onViewChange("grid")}
            ariaLabel="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </ViewToggleButton>
          <ViewToggleButton
            active={view === "list"}
            onClick={() => onViewChange("list")}
            ariaLabel="List view"
          >
            <Rows3 className="w-4 h-4" />
          </ViewToggleButton>
          <ViewToggleButton
            active={view === "map"}
            onClick={() => onViewChange("map")}
            ariaLabel="Map view"
          >
            <Map className="w-4 h-4" />
          </ViewToggleButton>
        </div>
      </div>
    </motion.div>
  )
}

function SectionPill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={
        active
          ? "px-3.5 py-2 rounded-full text-xs font-bold bg-brand-black text-white whitespace-nowrap"
          : "px-3.5 py-2 rounded-full text-xs font-semibold border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-brand-black whitespace-nowrap transition-colors"
      }
    >
      {label}
    </motion.button>
  )
}

function ViewToggleButton({
  active,
  onClick,
  ariaLabel,
  children,
}: {
  active: boolean
  onClick: () => void
  ariaLabel: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={
        active
          ? "relative px-2.5 py-1.5 rounded-lg bg-white text-brand-black shadow-sm"
          : "relative px-2.5 py-1.5 rounded-lg text-neutral-500 hover:text-brand-black"
      }
    >
      {children}
    </button>
  )
}
