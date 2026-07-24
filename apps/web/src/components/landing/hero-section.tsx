"use client"

import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"
import { CtaLink } from "./cta-link"
import { AuroraBackground } from "./aurora-background"
import { HeroVisual } from "./hero-visual"

const EASE = [0.22, 1, 0.36, 1] as const

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-36 pb-24 sm:pt-44 sm:pb-32 px-6">
      <AuroraBackground />

      <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-16 lg:gap-10 items-center">
        <div className="flex flex-col items-start text-left">
          <motion.span
            initial={{ y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary"
          >
            <Sparkles size={12} />
            QR ordering · AR menus · Zero commission
          </motion.span>

          <motion.h1
            initial={{ y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.12, ease: EASE }}
            className="font-heading text-5xl sm:text-6xl lg:text-[4rem] font-extrabold tracking-tight text-ink leading-[0.98] mt-7"
          >
            Everything your restaurant needs to feel{" "}
            <span className="font-serif italic text-primary">effortless.</span>
          </motion.h1>

          <motion.p
            initial={{ y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.28, ease: EASE }}
            className="mt-7 text-lg text-muted font-medium max-w-xl leading-relaxed"
          >
            QR ordering, AR 3D menus, live kitchen displays and per-restaurant wallets — one premium
            platform that keeps every order, and every dollar, with you.
          </motion.p>

          <motion.div
            initial={{ y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.42, ease: EASE }}
            className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          >
            <CtaLink href="/register" size="lg">
              Start free
              <ArrowRight
                size={17}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </CtaLink>
            <CtaLink href="/login" variant="outline" size="lg">
              Sign in
            </CtaLink>
          </motion.div>

          <motion.div
            initial={{ y: 12 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, delay: 0.6, ease: EASE }}
            className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted font-medium"
          >
            <span>No setup fee</span>
            <span className="h-1 w-1 rounded-full bg-muted/50" />
            <span>Cancel anytime</span>
            <span className="h-1 w-1 rounded-full bg-muted/50" />
            <span>Live in minutes</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: EASE }}
        >
          <HeroVisual />
        </motion.div>
      </div>
    </section>
  )
}
