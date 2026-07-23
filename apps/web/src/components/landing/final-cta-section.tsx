"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { AuroraBackground } from "./aurora-background"
import { CtaLink } from "./cta-link"

const EASE = [0.22, 1, 0.36, 1] as const

export function FinalCtaSection() {
  return (
    <section className="relative py-20 sm:py-28 px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="relative overflow-hidden rounded-[2.5rem] bg-ink px-8 py-20 sm:py-24 text-center"
        >
          <AuroraBackground />

          <motion.span
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-canvas/20 bg-canvas/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-accent"
          >
            Get started
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-canvas leading-[1.02] mt-6 max-w-2xl mx-auto"
          >
            Your restaurant, finally{" "}
            <span className="font-serif italic text-accent">in sync.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.65, delay: 0.2, ease: EASE }}
            className="mt-6 text-lg text-canvas/70 font-medium max-w-xl mx-auto leading-relaxed"
          >
            Join Vision Menu and turn QR scans into seated, paid, satisfied tables — without lifting
            a finger.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.65, delay: 0.32, ease: EASE }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <CtaLink href="/register" size="lg">
              Create your restaurant
              <ArrowRight
                size={17}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </CtaLink>
            <CtaLink href="/login" variant="invert" size="lg">
              Sign in
            </CtaLink>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
