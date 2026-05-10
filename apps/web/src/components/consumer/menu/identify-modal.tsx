"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { cn } from "@/lib/utils"

interface IdentifyModalProps {
  isOpen: boolean
  canteenName?: string | null
  loading: boolean
  error: string
  onSubmit: (params: { name: string; phone: string }) => void | Promise<void>
}

interface FloatingFieldProps {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  inputMode?: "tel" | "text"
  maxLength?: number
  autoFocus?: boolean
}

function FloatingField({
  id,
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  maxLength,
  autoFocus,
}: FloatingFieldProps) {
  const [focused, setFocused] = useState(false)
  const lifted = focused || value.length > 0

  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxLength={maxLength}
        autoFocus={autoFocus}
        autoComplete="off"
        className={cn(
          "peer w-full h-14 px-4 pt-5 pb-1.5 rounded-2xl bg-white text-brand-black text-base font-medium transition-all",
          "border border-brand-black/15 focus:border-brand-black focus:outline-none focus:ring-4 focus:ring-brand-black/[0.06]"
        )}
      />
      <label
        htmlFor={id}
        className={cn(
          "absolute left-4 pointer-events-none transition-all duration-200 ease-out font-medium",
          lifted
            ? "top-1.5 text-[10px] uppercase tracking-[0.18em] text-brand-black/55 font-bold"
            : "top-1/2 -translate-y-1/2 text-base text-brand-black/45"
        )}
      >
        {label}
      </label>
    </div>
  )
}

export function IdentifyModal({ isOpen, canteenName, loading, error, onSubmit }: IdentifyModalProps) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [localError, setLocalError] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLocalError("")
    const trimmedName = name.trim()
    if (!trimmedName) {
      setLocalError("Please enter your name")
      return
    }
    if (!/^\d{10}$/.test(phone)) {
      setLocalError("Enter a valid 10-digit phone number")
      return
    }
    onSubmit({ name: trimmedName, phone })
  }

  const shownError = localError || error

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-brand-black flex items-center justify-center px-5"
        >
          <img
            src="https://res.cloudinary.com/dpjw3fe8d/image/upload/v1773754347/orderkaro/branding/orderkaro-hero-3.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-black/70 via-brand-black/40 to-brand-black/85" />

          <motion.div
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="bg-white rounded-[28px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4)] p-7 sm:p-9">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="flex flex-col items-center text-center"
              >
                <Logo size="lg" />
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-black/45 mt-5">
                  Welcome
                </p>
                <h2 className="font-heading text-2xl font-extrabold text-brand-black tracking-tight mt-1.5">
                  {canteenName ?? "to your table"}
                </h2>
                <p className="font-serif italic text-base text-brand-black/55 mt-2">
                  Tell us who you are to get started.
                </p>
              </motion.div>

              <motion.form
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                onSubmit={handleSubmit}
                className="mt-7 space-y-3"
              >
                <FloatingField
                  id="identify-name"
                  label="Your name"
                  value={name}
                  onChange={setName}
                  autoFocus
                />
                <FloatingField
                  id="identify-phone"
                  label="10-digit phone number"
                  value={phone}
                  onChange={(v) => setPhone(v.replace(/\D/g, "").slice(0, 10))}
                  type="tel"
                  inputMode="tel"
                  maxLength={10}
                />

                <AnimatePresence>
                  {shownError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -4, height: 0 }}
                      className="text-[12px] font-semibold text-brand-red"
                    >
                      {shownError}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ y: -1 }}
                  disabled={loading}
                  className="group w-full h-14 mt-2 rounded-2xl bg-brand-black text-white flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-[0.18em] disabled:opacity-50 disabled:pointer-events-none transition-shadow hover:shadow-lg hover:shadow-brand-black/20"
                >
                  {loading ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <>
                      Continue
                      <motion.span
                        initial={false}
                        animate={{ x: 0 }}
                        whileHover={{ x: 4 }}
                        className="inline-flex"
                      >
                        <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
                      </motion.span>
                    </>
                  )}
                </motion.button>
              </motion.form>

              <p className="text-center text-[11px] text-brand-black/40 mt-7">
                Used only for this order session
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
