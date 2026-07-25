"use client"

import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { ScanLine, Box, CreditCard, ChefHat } from "lucide-react"
import { SectionHeading } from "./section-heading"

const EASE = [0.22, 1, 0.36, 1] as const

interface StepItem {
  icon: LucideIcon
  title: string
  copy: string
}

const STEPS: StepItem[] = [
  {
    icon: ScanLine,
    title: "Scan",
    copy: "Guests scan the QR code at their table — no app, no signup, no waiting for a waiter.",
  },
  {
    icon: Box,
    title: "Browse & customize",
    copy: "They explore your live menu, rotate signature dishes in AR and customize freely.",
  },
  {
    icon: CreditCard,
    title: "Order & pay",
    copy: "Orders and payment land straight on your dashboard — pay online or at the counter, confirmed instantly.",
  },
  {
    icon: ChefHat,
    title: "Prepare & serve",
    copy: "Your kitchen and counter displays update instantly, so food goes out fast, every time.",
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14 } },
}

const stepVariants = {
  hidden: { y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
}

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative scroll-mt-24 py-28 sm:py-36 px-6 bg-surface/60">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="How it works"
          title={
            <>
              From table to kitchen
              <br />
              <span className="font-serif italic text-primary">in four steps.</span>
            </>
          }
          subtitle="No hardware to install, no staff training marathon — just a QR code and a calmer service."
        />

        <div className="relative mt-20">
          <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-line" />
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 1.3, ease: EASE }}
            style={{ transformOrigin: "left" }}
            className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-primary"
          />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={containerVariants}
            className="relative grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-6"
          >
            {STEPS.map((step, index) => (
              <motion.div
                key={step.title}
                variants={stepVariants}
                className="relative flex flex-col items-start lg:items-center lg:text-center"
              >
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-canvas border-2 border-primary/30 text-ink font-heading font-extrabold text-xl shadow-sm">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-md">
                    <step.icon size={13} />
                  </div>
                </div>
                <h3 className="font-heading text-lg font-bold text-ink mt-6">{step.title}</h3>
                <p className="text-sm text-muted leading-relaxed mt-2 max-w-[240px]">{step.copy}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
