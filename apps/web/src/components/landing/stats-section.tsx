"use client"

import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { Zap, Layers, Sparkles, Radio } from "lucide-react"

const EASE = [0.22, 1, 0.36, 1] as const

interface StatItem {
  icon: LucideIcon
  value: string
  label: string
}

const STATS: StatItem[] = [
  {
    icon: Zap,
    value: "0%",
    label: "Order commission — ever. Payments settle directly to your own PayPur or Stripe account.",
  },
  {
    icon: Layers,
    value: "3-in-1",
    label: "Owner, kitchen and counter — three tailored interfaces, one login.",
  },
  {
    icon: Sparkles,
    value: "Minutes",
    label: "From sign-up to a live, scannable table QR code.",
  },
  {
    icon: Radio,
    value: "Live",
    label: "Kitchen and counter displays that stay in sync with every new order.",
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

export function StatsSection() {
  return (
    <section className="relative py-24 sm:py-28 px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-3xl border border-line bg-surface shadow-sm divide-y divide-line lg:divide-y-0 lg:divide-x"
        >
          {STATS.map((stat) => (
            <motion.div
              key={stat.value + stat.label}
              variants={itemVariants}
              className="flex flex-col items-start p-8 sm:p-10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <stat.icon size={18} />
              </div>
              <p className="font-heading text-3xl sm:text-4xl font-extrabold text-ink mt-5">{stat.value}</p>
              <p className="text-sm text-muted leading-relaxed mt-2.5">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
