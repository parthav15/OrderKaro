"use client"

import type { CSSProperties, ReactNode } from "react"
import { DEFAULT_BRAND_COLOR, hexToRgbTriplet } from "@/lib/brand-color"

export function StorefrontTheme({
  primaryColor,
  className,
  children,
}: {
  primaryColor?: string | null
  className?: string
  children: ReactNode
}) {
  const style = {
    "--brand-red": hexToRgbTriplet(primaryColor || DEFAULT_BRAND_COLOR),
  } as CSSProperties

  return (
    <div style={style} className={className}>
      {children}
    </div>
  )
}
