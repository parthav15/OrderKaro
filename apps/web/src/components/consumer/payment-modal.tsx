"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { X, Smartphone, ExternalLink, ShieldCheck } from "lucide-react"
import QRCode from "qrcode"
import { usePaymentPolling } from "@/hooks/use-payment-polling"

interface PaymentSession {
  provider: "PAYPUR" | "STRIPE"
  redirectUrl: string
  qrUrl?: string | null
  upiIntent?: string | null
  amount: number
  currency: string
  pollUrl: string
  pollBody: Record<string, unknown>
}

interface PaymentModalProps {
  open: boolean
  session: PaymentSession | null
  title?: string
  onSuccess: (data: any) => void
  onClose: () => void
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
}

function formatAmount(amount: number, currency: string) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `
  return `${symbol}${Number(amount).toFixed(0)}`
}

type Stage = "paying" | "success" | "failed"

export function PaymentModal({ open, session, title, onSuccess, onClose }: PaymentModalProps) {
  const [stage, setStage] = useState<Stage>("paying")
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrFailed, setQrFailed] = useState(false)
  const [resolvedData, setResolvedData] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
  }, [])

  useEffect(() => {
    if (open) setStage("paying")
  }, [open, session])

  useEffect(() => {
    if (!open || session?.provider !== "PAYPUR" || !session.upiIntent) {
      setQrDataUrl(null)
      setQrFailed(false)
      return
    }
    let cancelled = false
    setQrFailed(false)
    QRCode.toDataURL(session.upiIntent, {
      margin: 1,
      width: 240,
      color: { dark: "#0A0A0A", light: "#FFFFFF" },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setQrFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [open, session])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  const { polling } = usePaymentPolling({
    pollUrl: session?.pollUrl,
    pollBody: session?.pollBody,
    enabled: open && !!session && stage === "paying",
    onResolved: (status, data) => {
      if (status === "PAID") {
        setResolvedData(data)
        setStage("success")
        window.setTimeout(() => onSuccess(data), 1100)
      } else if (status === "FAILED") {
        setStage("failed")
      }
    },
  })

  if (!session) return null

  const amountLabel = formatAmount(session.amount, session.currency)

  function handlePayWithUpi() {
    if (session?.upiIntent) {
      window.location.href = session.upiIntent
    }
  }

  function handleContinueToStripe() {
    if (session?.redirectUrl) {
      window.open(session.redirectUrl, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={stage === "paying" ? onClose : onClose}
          />

          <motion.div
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 24 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="relative w-full max-w-[420px] bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-full text-neutral-400 hover:text-brand-black hover:bg-neutral-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <AnimatePresence mode="wait">
              {stage === "paying" && (
                <motion.div
                  key="paying"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="px-8 pt-10 pb-8"
                >
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1">
                    {title ?? "Complete payment"}
                  </p>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-extrabold text-brand-black tracking-tight">
                      {amountLabel}
                    </span>
                    <span className="text-sm text-neutral-400">{session.currency}</span>
                  </div>

                  {session.provider === "PAYPUR" && (
                    <>
                      <div className="flex justify-center mb-4">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1, type: "spring", damping: 20, stiffness: 260 }}
                          className="relative w-[168px] h-[168px] rounded-2xl bg-white border border-neutral-100 shadow-sm flex items-center justify-center overflow-hidden"
                        >
                          {qrDataUrl ? (
                            <img src={qrDataUrl} alt="Scan to pay" className="w-full h-full object-contain" />
                          ) : qrFailed && session.qrUrl ? (
                            <img src={session.qrUrl} alt="Scan to pay" className="w-full h-full object-contain" />
                          ) : (
                            <div className="w-10 h-10 border-2 border-neutral-200 border-t-brand-red rounded-full animate-spin" />
                          )}
                          {!reducedMotion && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent"
                              initial={{ x: "-120%" }}
                              animate={{ x: "120%" }}
                              transition={{ duration: 1.1, delay: 0.3, ease: "easeInOut" }}
                            />
                          )}
                        </motion.div>
                      </div>
                      <p className="text-center text-sm text-neutral-500 mb-6">
                        Scan with any UPI app
                      </p>

                      {isMobile && (
                        <>
                          <div className="flex items-center gap-3 mb-6">
                            <div className="h-px flex-1 bg-neutral-100" />
                            <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-300">or</span>
                            <div className="h-px flex-1 bg-neutral-100" />
                          </div>

                          <button
                            onClick={handlePayWithUpi}
                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-red text-white font-semibold text-sm hover:bg-red-700 active:scale-[0.98] transition-all"
                          >
                            <Smartphone className="w-4 h-4" />
                            Pay with UPI app
                          </button>
                        </>
                      )}
                    </>
                  )}

                  {session.provider === "STRIPE" && (
                    <>
                      <div className="flex items-start gap-2.5 mb-6 p-4 rounded-xl bg-neutral-50">
                        <ShieldCheck className="w-4 h-4 text-brand-red shrink-0 mt-0.5" />
                        <p className="text-sm text-neutral-500 leading-relaxed">
                          You&apos;ll complete payment on Stripe&apos;s secure page.
                        </p>
                      </div>

                      <button
                        onClick={handleContinueToStripe}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-red text-white font-semibold text-sm hover:bg-red-700 active:scale-[0.98] transition-all mb-3"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Continue to payment
                      </button>

                      <button
                        onClick={handleContinueToStripe}
                        className="w-full text-center text-xs font-medium text-neutral-400 hover:text-brand-black transition-colors"
                      >
                        Reopen payment page
                      </button>
                    </>
                  )}

                  <div className="flex items-center justify-center gap-2 mt-7">
                    <span className="relative flex h-2 w-2">
                      {!reducedMotion && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-60" />
                      )}
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-red" />
                    </span>
                    <span className="text-xs font-medium text-neutral-400">
                      {polling ? "Waiting for payment…" : "Preparing…"}
                    </span>
                  </div>
                </motion.div>
              )}

              {stage === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="px-8 py-14 flex flex-col items-center"
                >
                  <motion.div
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 14, stiffness: 260 }}
                    className="w-20 h-20 rounded-full bg-brand-red/10 flex items-center justify-center mb-6"
                  >
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <motion.circle
                        cx="20"
                        cy="20"
                        r="18"
                        stroke="#DC2626"
                        strokeWidth="2"
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5 }}
                      />
                      <motion.path
                        d="M12 20.5L17 25.5L28 14.5"
                        stroke="#DC2626"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.4, delay: 0.4 }}
                      />
                    </svg>
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg font-bold text-brand-black"
                  >
                    Payment successful
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-neutral-400 mt-1"
                  >
                    {amountLabel} received
                  </motion.p>
                </motion.div>
              )}

              {stage === "failed" && (
                <motion.div
                  key="failed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="px-8 py-14 flex flex-col items-center"
                >
                  <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-6">
                    <X className="w-9 h-9 text-neutral-400" />
                  </div>
                  <p className="text-lg font-bold text-brand-black mb-1">Payment failed</p>
                  <p className="text-sm text-neutral-400 mb-7 text-center">
                    The payment did not go through. You can try again.
                  </p>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={onClose}
                      className="flex-1 py-3 rounded-xl border border-neutral-200 text-sm font-semibold text-brand-black hover:bg-neutral-50 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 py-3 rounded-xl bg-brand-red text-white text-sm font-semibold hover:bg-red-700 transition-colors"
                    >
                      Try again
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
