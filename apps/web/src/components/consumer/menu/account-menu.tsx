"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { LogOut } from "lucide-react"

interface AccountMenuProps {
  firstName: string | null
  name: string | null
  phone?: string | null
  onLogout: () => void
}

export function AccountMenu({ firstName, name, phone, onLogout }: AccountMenuProps) {
  const [open, setOpen] = useState(false)
  const initial = (firstName || name || "").trim().charAt(0).toUpperCase() || "•"

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <div className="relative shrink-0">
      <motion.button
        whileTap={{ scale: 0.92 }}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account"
        aria-expanded={open}
        className="w-10 h-10 rounded-full bg-ink/[0.04] hover:bg-ink/[0.08] text-ink flex items-center justify-center font-heading text-sm font-extrabold transition-colors"
      >
        {initial}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-full mt-2 z-50 w-60 origin-top-right rounded-2xl border border-line bg-surface-elevated p-1.5 shadow-[0_24px_60px_-24px_rgba(20,17,16,0.45)]"
            >
              <div className="flex items-center gap-3 px-3 py-3">
                <div className="w-10 h-10 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center font-heading text-base font-extrabold">
                  {initial}
                </div>
                <div className="min-w-0">
                  <p className="font-heading text-sm font-bold text-ink truncate">
                    {name || "Guest"}
                  </p>
                  {phone && (
                    <p className="text-xs text-ink/50 font-medium tabular-nums truncate">{phone}</p>
                  )}
                </div>
              </div>

              <div className="h-px bg-line mx-2 my-1" />

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => {
                  setOpen(false)
                  onLogout()
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-danger hover:bg-danger/[0.07] transition-colors"
              >
                <LogOut className="w-4 h-4" strokeWidth={2.2} />
                Sign out
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
