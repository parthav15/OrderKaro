"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { Wallet } from "lucide-react"
import { formatPrice } from "@/lib/utils"

interface MenuHeroProps {
  consumerFirstName: string | null
  restaurantName: string
  tableLabel: string | null
  walletBalance: number | null
  closingTime: string | null
  isOpen: boolean
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 5) return "Good night"
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  if (h < 22) return "Good evening"
  return "Good night"
}

export function MenuHero({
  consumerFirstName,
  restaurantName,
  tableLabel,
  walletBalance,
  closingTime,
  isOpen,
}: MenuHeroProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 120, 200], [1, 0.5, 0])
  const y = useTransform(scrollY, [0, 200], [0, -28])

  const greeting = consumerFirstName
    ? `${getGreeting()}, ${consumerFirstName}.`
    : `${getGreeting()}.`

  const meta: { label: string; key: string }[] = []
  if (tableLabel) meta.push({ key: "table", label: tableLabel })
  if (isOpen && closingTime) meta.push({ key: "hours", label: `Open until ${closingTime}` })

  return (
    <motion.header
      ref={ref}
      style={{ opacity, y }}
      className="px-5 pt-14 pb-9 relative"
    >
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="text-sm text-ink/55 font-medium"
      >
        {greeting}
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="font-heading text-[44px] sm:text-5xl font-extrabold tracking-tight text-ink mt-1.5 leading-[0.96]"
      >
        {restaurantName}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mt-3.5 flex items-center gap-2 text-sm text-ink/55 font-medium flex-wrap"
      >
        {meta.map((m, i) => (
          <span key={m.key} className="flex items-center gap-2">
            {i > 0 && <span className="text-ink/25">·</span>}
            <span>{m.label}</span>
          </span>
        ))}
        {walletBalance !== null && (
          <>
            {meta.length > 0 && <span className="text-ink/25">·</span>}
            <span className="inline-flex items-center gap-1.5 text-ink/75">
              <Wallet className="w-3.5 h-3.5" strokeWidth={2.2} />
              <span className="font-semibold">{formatPrice(walletBalance)}</span>
              <span className="text-ink/40">in wallet</span>
            </span>
          </>
        )}
      </motion.div>
    </motion.header>
  )
}
