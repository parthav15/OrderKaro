"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import type { ReactNode } from "react"
import { Logo } from "@/components/ui/logo"
import { SiteFooter } from "@/components/landing/site-footer"

const EASE = [0.22, 1, 0.36, 1] as const

export function LegalShell({
  eyebrow,
  title,
  subtitle,
  updated,
  children,
}: {
  eyebrow: string
  title: string
  subtitle: string
  updated: string
  children: ReactNode
}) {
  return (
    <div className="relative min-h-screen bg-canvas">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-60"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, rgba(163,29,51,0.10) 0%, rgba(163,29,51,0) 70%)",
        }}
      />

      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link href="/" aria-label="Vision Menu home">
          <Logo size="md" />
        </Link>
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink/80 transition-colors hover:border-primary/40 hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to home
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-6 pb-24 pt-10 sm:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-primary">{eyebrow}</span>
          <h1 className="mt-4 font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{subtitle}</p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
            <span className="text-xs font-semibold text-muted">Last updated {updated}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-12 h-px w-full bg-gradient-to-r from-transparent via-line to-transparent"
        />

        <div className="mt-4 flex flex-col gap-12">{children}</div>
      </main>

      <SiteFooter />
    </div>
  )
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="scroll-mt-24"
    >
      <h2 className="font-heading text-xl font-bold text-ink sm:text-2xl">{title}</h2>
      <div className="mt-4 flex flex-col gap-4 text-[15px] leading-relaxed text-ink/70">{children}</div>
    </motion.section>
  )
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
          <span className="text-[15px] leading-relaxed text-ink/70">{item}</span>
        </li>
      ))}
    </ul>
  )
}
