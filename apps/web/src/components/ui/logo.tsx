interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "light" | "dark"
  showText?: boolean
}

const sizeMap = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-3xl",
  xl: "text-4xl",
}

export function Logo({ size = "md", variant = "light" }: LogoProps) {
  const textColor = variant === "dark" ? "text-white" : "text-ink"

  return (
    <span className="inline-flex items-baseline select-none">
      <span
        className={`font-serif italic tracking-tight leading-none ${sizeMap[size]} ${textColor}`}
      >
        Vision
      </span>
      <span
        className={`font-serif italic tracking-tight leading-none ml-1.5 ${sizeMap[size]} text-brand-red`}
      >
        Menu
      </span>
    </span>
  )
}
