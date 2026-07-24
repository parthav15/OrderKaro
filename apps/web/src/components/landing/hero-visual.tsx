"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion"
import type { MotionValue } from "framer-motion"
import { QrCode, Sparkles, Check, Clock, Wallet } from "lucide-react"

interface FloatCardProps {
  parallax: MotionValue<number>
  floatDuration: number
  delay: number
  className: string
  children: React.ReactNode
}

function FloatCard({ parallax, floatDuration, delay, className, children }: FloatCardProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div style={{ y: parallax }} className={className}>
      <motion.div
        initial={{ scale: 0.88, y: 36 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
          transition={{ duration: floatDuration, repeat: Infinity, ease: "easeInOut", delay }}
        >
          {children}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

const MENU_ROWS = [
  { name: "Wood-Fired Margherita", price: "$14" },
  { name: "Truffle Arancini", price: "$12" },
  { name: "Burnt Butter Pasta", price: "$18" },
]

const TICKET_ROWS = [
  { label: "Truffle Arancini x2", done: true },
  { label: "Burnt Butter Pasta", done: true },
  { label: "Iced Americano", done: false },
]

const CHART_BARS = [40, 65, 45, 80, 60, 95]

export function HeroVisual() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] })

  const yMenu = useTransform(scrollYProgress, [0, 1], [30, -50])
  const yKitchen = useTransform(scrollYProgress, [0, 1], [70, -90])
  const yWallet = useTransform(scrollYProgress, [0, 1], [10, -30])

  return (
    <div ref={containerRef} className="relative h-[420px] sm:h-[480px] lg:h-[560px] w-full max-w-lg mx-auto">
      <div className="absolute left-1/2 top-1/2 -z-10 h-[85%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[100px]" />

      <FloatCard
        parallax={yMenu}
        floatDuration={6}
        delay={0.15}
        className="absolute left-1/2 top-0 -translate-x-1/2 w-[220px] sm:w-[240px] z-20"
      >
        <div className="relative rounded-[2rem] border border-line bg-surface-elevated shadow-2xl shadow-ink/10 p-4 pt-3">
          <div className="mx-auto h-1.5 w-14 rounded-full bg-ink/10 mb-4" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-canvas">
              <QrCode size={16} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Table 04</span>
          </div>
          <div className="space-y-2.5">
            {MENU_ROWS.map((row) => (
              <div
                key={row.name}
                className="flex items-center justify-between gap-2 rounded-xl bg-canvas px-3 py-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2 w-2 shrink-0 rounded-full border border-success" />
                  <span className="truncate text-xs font-semibold text-ink">{row.name}</span>
                </div>
                <span className="shrink-0 text-xs font-bold text-ink">{row.price}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-primary px-4 py-3 text-white">
            <span className="text-xs font-bold">3 items</span>
            <span className="text-xs font-bold">$44</span>
          </div>

          <div className="absolute -right-4 -top-3 flex items-center gap-1.5 rounded-full border border-accent/40 bg-surface px-2.5 py-1 shadow-lg">
            <Sparkles size={11} className="text-accent" />
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-accent">AR menu</span>
          </div>
        </div>
      </FloatCard>

      <FloatCard
        parallax={yKitchen}
        floatDuration={5}
        delay={0.35}
        className="absolute right-0 top-6 sm:top-10 w-[170px] sm:w-[188px] z-30 -rotate-6"
      >
        <div className="rounded-2xl border border-line bg-surface shadow-xl shadow-ink/10 p-3.5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-heading text-sm font-extrabold text-ink">#128</span>
            <span className="rounded-full bg-success/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-success">
              New
            </span>
          </div>
          <div className="space-y-2">
            {TICKET_ROWS.map((row) => (
              <div key={row.label} className="flex items-center gap-2">
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    row.done ? "border-ink bg-ink text-canvas" : "border-line text-transparent"
                  }`}
                >
                  <Check size={10} strokeWidth={3} />
                </span>
                <span className="text-[11px] font-medium text-ink/80 truncate">{row.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-muted">
            <Clock size={11} />
            2m ago
          </div>
        </div>
      </FloatCard>

      <FloatCard
        parallax={yWallet}
        floatDuration={7}
        delay={0.5}
        className="absolute left-0 bottom-4 sm:bottom-8 w-[168px] sm:w-[182px] z-10 rotate-6"
      >
        <div className="rounded-2xl bg-ink text-canvas shadow-xl p-3.5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-canvas/55">
              Wallet
            </span>
            <Wallet size={14} className="text-accent" />
          </div>
          <p className="font-heading text-xl font-extrabold">$250</p>
          <div className="mt-3 flex items-end gap-1 h-10">
            {CHART_BARS.map((height, i) => (
              <span
                key={i}
                className="flex-1 rounded-full bg-accent/70"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      </FloatCard>
    </div>
  )
}
