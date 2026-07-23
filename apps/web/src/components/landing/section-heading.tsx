"use client"

import { motion } from "framer-motion"

interface SectionHeadingProps {
  eyebrow: string
  title: React.ReactNode
  subtitle?: string
  align?: "center" | "left"
}

export function SectionHeading({ eyebrow, title, subtitle, align = "center" }: SectionHeadingProps) {
  const wrapperAlignment =
    align === "center" ? "items-center text-center mx-auto" : "items-start text-left"

  return (
    <div className={`flex flex-col ${wrapperAlignment} max-w-2xl`}>
      <motion.span
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary"
      >
        {eyebrow}
      </motion.span>
      <motion.h2
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight text-ink mt-5 leading-[1.05]"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 text-lg text-muted font-medium"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  )
}
