"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Check, ChevronDown, CreditCard, Coins } from "lucide-react"
import { SUPPORTED_COUNTRIES, countryByCode } from "@orderkaro/shared"

export function CountryPicker({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (code: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = countryByCode(value) ?? SUPPORTED_COUNTRIES[0]
  const gateway = selected.code === "IN" ? "Cashfree" : "Stripe"

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return SUPPORTED_COUNTRIES
    return SUPPORTED_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.currency.toLowerCase().includes(q) ||
        c.dialCode.includes(q)
    )
  }, [query])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("mousedown", onClick)
    window.addEventListener("keydown", onKey)
    const t = window.setTimeout(() => inputRef.current?.focus(), 60)
    return () => {
      window.removeEventListener("mousedown", onClick)
      window.removeEventListener("keydown", onKey)
      window.clearTimeout(t)
    }
  }, [open])

  function pick(code: string) {
    onChange(code)
    setOpen(false)
    setQuery("")
  }

  return (
    <div ref={rootRef} className="relative">
      <motion.button
        type="button"
        disabled={disabled}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          disabled ? "opacity-60" : "hover:border-primary/50"
        }`}
      >
        <span className="text-2xl leading-none">{selected.flag}</span>
        <span className="flex-1 min-w-0">
          <span className="block truncate text-sm font-bold text-ink">{selected.name}</span>
          <span className="mt-0.5 flex items-center gap-2 text-[11px] font-medium text-muted">
            <span className="inline-flex items-center gap-1">
              <CreditCard className="h-3 w-3 text-brand-gold" /> {gateway}
            </span>
            <span className="text-line">·</span>
            <span className="inline-flex items-center gap-1">
              <Coins className="h-3 w-3 text-brand-gold" /> {selected.currency}
            </span>
          </span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-muted" />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-line bg-surface-elevated shadow-2xl shadow-black/10 ring-1 ring-black/5"
          >
            <div className="border-b border-line p-2.5">
              <div className="flex items-center gap-2 rounded-xl bg-surface px-3">
                <Search className="h-4 w-4 text-muted" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search country or currency"
                  className="h-10 flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
                />
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto p-1.5">
              {filtered.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted">No match</p>
              ) : (
                filtered.map((c, i) => {
                  const active = c.code === selected.code
                  return (
                    <motion.button
                      key={c.code}
                      type="button"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.012, 0.2) }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => pick(c.code)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                        active ? "bg-primary/10" : "hover:bg-surface"
                      }`}
                    >
                      <span className="text-xl leading-none">{c.flag}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink">{c.name}</span>
                        <span className="text-[11px] text-muted">
                          {c.dialCode} · {c.currency}
                        </span>
                      </span>
                      <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted ring-1 ring-line">
                        {c.code === "IN" ? "Cashfree" : "Stripe"}
                      </span>
                      <AnimatePresence>
                        {active && (
                          <motion.span
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                          >
                            <Check className="h-4 w-4 text-primary" strokeWidth={3} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
