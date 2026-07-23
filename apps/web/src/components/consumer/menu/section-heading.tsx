"use client"

import { motion } from "framer-motion"

interface SectionHeadingProps {
  eyebrow?: string
  title: string
  count?: number
}

export function SectionHeading({ eyebrow = "From the kitchen", title, count }: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="mb-5"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink/45">
            {eyebrow}
          </p>
          <h2 className="font-heading text-[34px] sm:text-[40px] font-extrabold tracking-tight text-ink leading-[0.98] mt-2">
            {title}
          </h2>
        </div>
        {typeof count === "number" && (
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink/40 pb-2 whitespace-nowrap">
            {String(count).padStart(2, "0")} {count === 1 ? "dish" : "dishes"}
          </p>
        )}
      </div>
      <div className="mt-4 h-px bg-ink/12" />
    </motion.div>
  )
}
