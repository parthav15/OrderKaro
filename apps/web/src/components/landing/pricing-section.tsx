"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { PLANS } from "@/lib/plans"
import { formatPrice } from "@/lib/utils"
import { SectionHeading } from "./section-heading"
import { CtaLink } from "./cta-link"

const EASE = [0.22, 1, 0.36, 1] as const

const PRICING_PLANS = [
  {
    id: "FREE",
    label: "Free",
    price: formatPrice(PLANS.FREE.monthlyPrice),
    period: "/month",
    description: "Everything you need to try Vision Menu on a small menu.",
    cta: "Start free",
    variant: "outline" as const,
    highlighted: false,
    features: [
      `Up to ${PLANS.FREE.maxMenuItems} menu items`,
      `Up to ${PLANS.FREE.maxTables} tables`,
      "QR ordering, kitchen & counter display",
      "Instant checkout",
    ],
  },
  {
    id: "BASIC",
    label: "Basic",
    price: formatPrice(PLANS.BASIC.monthlyPrice),
    period: "/month",
    description: "For growing restaurants ready to look and feel premium.",
    cta: "Get started",
    variant: "primary" as const,
    highlighted: true,
    features: [
      `Up to ${PLANS.BASIC.maxMenuItems} menu items`,
      `Up to ${PLANS.BASIC.maxTables} tables`,
      "Custom branding",
      "Delivery zones",
      "Sales analytics",
    ],
  },
  {
    id: "PRO",
    label: "Pro",
    price: formatPrice(PLANS.PRO.monthlyPrice),
    period: "/month",
    description: "The full platform, including augmented reality menus.",
    cta: "Go Pro",
    variant: "outline" as const,
    highlighted: false,
    features: [
      `Up to ${PLANS.PRO.maxMenuItems} menu items`,
      `Up to ${PLANS.PRO.maxTables} tables`,
      "AR 3D menu",
      "Everything in Basic",
    ],
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const cardVariants = {
  hidden: { y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
}

export function PricingSection() {
  return (
    <section id="pricing" className="relative scroll-mt-24 py-28 sm:py-36 px-6">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Pricing"
          title={
            <>
              Simple plans.
              <br />
              <span className="font-serif italic text-primary">No surprises.</span>
            </>
          }
          subtitle="Start free. Upgrade only when your restaurant is ready to grow into it."
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={containerVariants}
          className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-5 items-start"
        >
          {PRICING_PLANS.map((plan) => (
            <motion.div
              key={plan.id}
              variants={cardVariants}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.3, ease: EASE }}
              className={`relative flex flex-col rounded-3xl p-8 ${
                plan.highlighted
                  ? "border-2 border-primary bg-surface shadow-2xl shadow-primary/10 lg:-translate-y-3"
                  : "border border-line bg-surface shadow-sm"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-md">
                  Most popular
                </span>
              )}

              <h3 className="font-heading text-xl font-bold text-ink">{plan.label}</h3>
              <p className="text-sm text-muted mt-2 leading-relaxed">{plan.description}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-heading text-4xl font-extrabold text-ink">{plan.price}</span>
                <span className="text-sm text-muted font-medium">{plan.period}</span>
              </div>

              <ul className="mt-8 flex flex-col gap-3.5 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-ink/80 font-medium">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check size={10} strokeWidth={3} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <CtaLink href="/register" variant={plan.variant} size="md" className="mt-8 w-full">
                {plan.cta}
              </CtaLink>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial={{ y: 12 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
          className="mt-12 text-center text-sm text-muted font-medium"
        >
          Prices in INR. Zero commission on any order, on every plan.
        </motion.p>
      </div>
    </section>
  )
}
