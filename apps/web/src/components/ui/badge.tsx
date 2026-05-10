"use client"

import { cn } from "@/lib/utils"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "veg" | "nonveg" | "editorial"
}

const badgeVariants = {
  default: "bg-neutral-100 text-neutral-700 px-2.5 py-0.5 rounded-full text-xs font-medium",
  success: "bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-medium",
  warning: "bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-medium",
  danger: "bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full text-xs font-medium",
  veg: "bg-green-100 text-green-700 border border-green-300 px-2.5 py-0.5 rounded-full text-xs font-medium",
  nonveg: "bg-red-100 text-red-700 border border-red-300 px-2.5 py-0.5 rounded-full text-xs font-medium",
  editorial:
    "text-[10px] font-bold uppercase tracking-[0.18em] text-brand-black/70 border border-brand-black/15 rounded-full px-2 py-[3px]",
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
