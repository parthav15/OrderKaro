"use client"

interface StatusDotProps {
  active: boolean
  size?: number
}

export function StatusDot({ active, size = 8 }: StatusDotProps) {
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <span
        style={{ width: size, height: size }}
        className={
          active
            ? "absolute inset-0 rounded-full bg-brand-red animate-ping opacity-60"
            : "absolute inset-0 rounded-full bg-neutral-300"
        }
      />
      <span
        style={{ width: size, height: size }}
        className={
          active
            ? "relative rounded-full bg-brand-red"
            : "relative rounded-full bg-neutral-400"
        }
      />
    </span>
  )
}
