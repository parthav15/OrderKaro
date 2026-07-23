"use client"

import { cn } from "@/lib/utils"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "veg" | "nonveg" | "editorial"
}

const badgeVariants = {
  default: "bg-surface-elevated text-muted px-2.5 py-0.5 rounded-full text-xs font-medium",
  success: "bg-success/10 text-success px-2.5 py-0.5 rounded-full text-xs font-medium",
  warning: "bg-warning/10 text-warning px-2.5 py-0.5 rounded-full text-xs font-medium",
  danger: "bg-danger/10 text-danger px-2.5 py-0.5 rounded-full text-xs font-medium",
  veg: "bg-success/10 text-success border border-success/30 px-2.5 py-0.5 rounded-full text-xs font-medium",
  nonveg: "bg-danger/10 text-danger border border-danger/30 px-2.5 py-0.5 rounded-full text-xs font-medium",
  editorial:
    "text-[10px] font-bold uppercase tracking-[0.18em] text-ink/70 border border-ink/15 rounded-full px-2 py-[3px]",
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-1", badgeVariants[variant], className)}
      {...props}
    >
      {children}
    </span>
  )
}
