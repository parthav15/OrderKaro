"use client"

import { cn } from "@/lib/utils"

interface VegMarkerProps {
  isVeg: boolean
  size?: "sm" | "md"
  className?: string
}

export function VegMarker({ isVeg, size = "md", className }: VegMarkerProps) {
  const sizeClass = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"
  const dotClass = size === "sm" ? "w-1.5 h-1.5" : "w-1.5 h-1.5"
  const colorClass = isVeg ? "border-brand-black" : "border-brand-red"
  const dotColorClass = isVeg ? "bg-brand-black" : "bg-brand-red"

  return (
    <span
      role="img"
      aria-label={isVeg ? "Vegetarian" : "Non-vegetarian"}
      className={cn(
        "inline-flex items-center justify-center border rounded-[2px] flex-shrink-0",
        sizeClass,
        colorClass,
        className
      )}
    >
      <span className={cn("rounded-full", dotClass, dotColorClass)} />
    </span>
  )
}
