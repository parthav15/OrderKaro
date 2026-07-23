"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, ArrowLeft } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import api from "@/lib/api"
import { cn } from "@/lib/utils"

interface VerifiedResult {
  consumer: { id: string; name: string; phone: string }
  accessToken: string
  refreshToken: string
}

interface IdentifyModalProps {
  isOpen: boolean
  restaurantName?: string | null
  onVerified: (result: VerifiedResult) => void
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

const RESEND_SECONDS = 30

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
          "peer w-full h-14 px-4 pt-5 pb-1.5 rounded-2xl bg-surface text-ink text-base font-medium transition-all",
          "border border-ink/15 focus:border-ink focus:outline-none focus:ring-4 focus:ring-ink/[0.06]"
        )}
      />
      <label
        htmlFor={id}
        className={cn(
          "absolute left-4 pointer-events-none transition-all duration-200 ease-out font-medium",
          lifted
            ? "top-1.5 text-[10px] uppercase tracking-[0.18em] text-ink/55 font-bold"
            : "top-1/2 -translate-y-1/2 text-base text-ink/45"
        )}
      >
        {label}
      </label>
    </div>
  )
}

function CodeField({
  value,
  onChange,
  onComplete,
}: {
  value: string
  onChange: (v: string) => void
  onComplete: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cells = Array.from({ length: 6 })

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350)
    return () => clearTimeout(t)
  }, [])

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.focus()}
      className="relative w-full flex justify-between gap-2"
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          const next = e.target.value.replace(/\D/g, "").slice(0, 6)
          onChange(next)
          if (next.length === 6) onComplete()
        }}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        className="absolute inset-0 w-full h-full opacity-0"
      />
      {cells.map((_, i) => {
        const active = i === value.length
        const filled = i < value.length
        return (
          <motion.span
            key={i}
            animate={{ scale: active ? 1.04 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 24 }}
            className={cn(
              "flex-1 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold font-heading transition-colors",
              filled
                ? "bg-ink text-canvas border border-ink"
                : active
                ? "bg-surface border-2 border-ink text-ink"
                : "bg-surface border border-ink/15 text-ink"
            )}
          >
            {value[i] ?? ""}
          </motion.span>
        )
      })}
    </button>
  )
}

export function IdentifyModal({ isOpen, restaurantName, onVerified }: IdentifyModalProps) {
  const [step, setStep] = useState<"phone" | "code">("phone")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendIn, setResendIn] = useState(0)

  useEffect(() => {
    if (resendIn <= 0) return
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [resendIn])

  async function sendCode() {
    setError("")
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError("Please enter your name")
      return
    }
    if (!/^\d{10}$/.test(phone)) {
      setError("Enter a valid 10-digit phone number")
      return
    }
    setLoading(true)
    try {
      await api.post("/api/v1/public/otp/request", { phone })
      setStep("code")
      setCode("")
      setResendIn(RESEND_SECONDS)
    } catch (err: any) {
      setError(err.response?.data?.error || "Couldn't send the code. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function verifyCode() {
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code")
      return
    }
    setError("")
    setLoading(true)
    try {
      const { data } = await api.post("/api/v1/public/otp/verify", {
        phone,
        name: name.trim(),
        code,
      })
      onVerified(data.data as VerifiedResult)
    } catch (err: any) {
      setError(err.response?.data?.error || "That code didn't work. Try again.")
      setCode("")
    } finally {
      setLoading(false)
    }
  }

  function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendCode()
  }

  function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    verifyCode()
  }

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
            <div className="bg-surface rounded-[28px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4)] p-7 sm:p-9">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="flex flex-col items-center text-center"
              >
                <Logo size="lg" />
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink/45 mt-5">
                  {step === "phone" ? "Welcome" : "Verify"}
                </p>
                <h2 className="font-heading text-2xl font-extrabold text-ink tracking-tight mt-1.5">
                  {step === "phone" ? restaurantName ?? "to your table" : "Enter your code"}
                </h2>
                <p className="font-serif italic text-base text-ink/55 mt-2">
                  {step === "phone"
                    ? "Verify your number to get started."
                    : `Sent to +91 ${phone}`}
                </p>
              </motion.div>

              <AnimatePresence mode="wait">
                {step === "phone" ? (
                  <motion.form
                    key="phone"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    onSubmit={handlePhoneSubmit}
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
                      {error && (
                        <motion.p
                          initial={{ opacity: 0, y: -4, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: "auto" }}
                          exit={{ opacity: 0, y: -4, height: 0 }}
                          className="text-[12px] font-semibold text-brand-red"
                        >
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <motion.button
                      type="submit"
                      whileTap={{ scale: 0.98 }}
                      whileHover={{ y: -1 }}
                      disabled={loading}
                      className="group w-full h-14 mt-2 rounded-2xl bg-ink text-canvas flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-[0.18em] disabled:opacity-50 disabled:pointer-events-none transition-shadow hover:shadow-lg hover:shadow-ink/20"
                    >
                      {loading ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <>
                          Send code
                          <motion.span initial={false} whileHover={{ x: 4 }} className="inline-flex">
                            <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
                          </motion.span>
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                ) : (
                  <motion.form
                    key="code"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    onSubmit={handleCodeSubmit}
                    className="mt-7 space-y-4"
                  >
                    <CodeField value={code} onChange={setCode} onComplete={verifyCode} />

                    <AnimatePresence>
                      {error && (
                        <motion.p
                          initial={{ opacity: 0, y: -4, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: "auto" }}
                          exit={{ opacity: 0, y: -4, height: 0 }}
                          className="text-[12px] font-semibold text-brand-red text-center"
                        >
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <motion.button
                      type="submit"
                      whileTap={{ scale: 0.98 }}
                      whileHover={{ y: -1 }}
                      disabled={loading}
                      className="group w-full h-14 rounded-2xl bg-ink text-canvas flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-[0.18em] disabled:opacity-50 disabled:pointer-events-none transition-shadow hover:shadow-lg hover:shadow-ink/20"
                    >
                      {loading ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <>
                          Verify &amp; continue
                          <motion.span initial={false} whileHover={{ x: 4 }} className="inline-flex">
                            <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
                          </motion.span>
                        </>
                      )}
                    </motion.button>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setStep("phone")
                          setCode("")
                          setError("")
                        }}
                        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink/55 hover:text-ink transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.4} />
                        Change number
                      </button>
                      <button
                        type="button"
                        disabled={resendIn > 0 || loading}
                        onClick={sendCode}
                        className="text-[12px] font-semibold text-ink/55 hover:text-ink transition-colors disabled:opacity-40 disabled:pointer-events-none"
                      >
                        {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              <p className="text-center text-[11px] text-ink/40 mt-7">
                We&apos;ll text you a one-time code. Standard rates may apply.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
