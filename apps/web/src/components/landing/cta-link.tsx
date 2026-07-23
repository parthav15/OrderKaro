"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface CtaLinkProps {
  href: string
  children: React.ReactNode
  variant?: "primary" | "outline" | "ghost" | "invert"
  size?: "md" | "lg"
  className?: string
  onClick?: () => void
}

const variantClasses: Record<NonNullable<CtaLinkProps["variant"]>, string> = {
  primary: "bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary-hover",
  outline: "bg-surface text-ink border border-line hover:bg-surface-elevated",
  ghost: "bg-transparent text-ink hover:bg-surface-elevated",
  invert: "bg-canvas/10 text-canvas border border-canvas/25 hover:bg-canvas/20",
}

const sizeClasses: Record<NonNullable<CtaLinkProps["size"]>, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-4 text-base",
}

export function CtaLink({
  href,
  children,
  variant = "primary",
  size = "lg",
  className,
  onClick,
}: CtaLinkProps) {
  return (
    <motion.a
      href={href}
      onClick={onClick}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </motion.a>
  )
}
