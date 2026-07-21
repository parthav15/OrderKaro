import type { ReactNode } from "react"
import { MotiView } from "moti"

export function Card({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 180, delay }}
      className={`bg-surface rounded-3xl border border-line p-5 ${className}`}
    >
      {children}
    </MotiView>
  )
}
