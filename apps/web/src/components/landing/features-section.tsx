"use client"

import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { QrCode, Box, Zap, MonitorSmartphone, UtensilsCrossed, BarChart3 } from "lucide-react"
import { SectionHeading } from "./section-heading"

const EASE = [0.22, 1, 0.36, 1] as const

interface FeatureItem {
  icon: LucideIcon
  title: string
  copy: string
  tag?: string
}

const FEATURES: FeatureItem[] = [
  {
    icon: QrCode,
    title: "QR ordering",
    copy: "Guests scan the table QR, browse your live menu and order in seconds — no app to download, ever.",
  },
  {
    icon: Box,
    title: "AR 3D menu",
    tag: "Pro",
    copy: "Let diners rotate and inspect signature dishes in augmented reality before a single item is ordered.",
  },
  {
    icon: Zap,
    title: "Instant, secure payments",
    copy: "Guests pay online with UPI or card, or cash at the counter — no top-ups, no stored balance, just order and go.",
  },
  {
    icon: MonitorSmartphone,
    title: "Live kitchen & counter",
    copy: "Orders land straight on a full-screen kitchen display and a counter pickup screen — no printers, no shouting.",
  },
  {
    icon: UtensilsCrossed,
    title: "Dine-in, takeaway, delivery",
    copy: "Every fulfillment type runs off the same menu, the same dashboard and the same kitchen queue.",
  },
  {
    icon: BarChart3,
    title: "Analytics that matter",
    tag: "Basic",
    copy: "Sales trends, best sellers and table performance — the numbers that actually change decisions.",
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const cardVariants = {
  hidden: { y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
}

export function FeaturesSection() {
  return (
    <section id="features" className="relative scroll-mt-24 py-28 sm:py-36 px-6">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Platform"
          title={
            <>
              Everything a restaurant needs.
              <br />
              <span className="font-serif italic text-primary">Nothing it doesn&apos;t.</span>
            </>
          }
          subtitle="Five interfaces worth of complexity, distilled into one calm, premium system."
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
          className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {FEATURES.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="group relative rounded-2xl border border-line bg-surface p-7 shadow-sm hover:shadow-xl hover:border-primary/30 transition-shadow duration-300"
            >
              {feature.tag && (
                <span className="absolute right-6 top-7 rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
                  {feature.tag}
                </span>
              )}
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                <feature.icon size={22} strokeWidth={2} />
              </div>
              <h3 className="font-heading text-xl font-bold text-ink mt-5">{feature.title}</h3>
              <p className="text-[15px] text-muted leading-relaxed mt-2.5">{feature.copy}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
