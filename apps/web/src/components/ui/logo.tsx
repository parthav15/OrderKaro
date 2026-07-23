import Image from "next/image"

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "light" | "dark"
  showText?: boolean
}

const sizeMap = {
  sm: { width: 132, height: 22 },
  md: { width: 162, height: 27 },
  lg: { width: 214, height: 36 },
  xl: { width: 272, height: 46 },
}

export function Logo({ size = "md", variant }: LogoProps) {
  const { width, height } = sizeMap[size]

  if (variant === "dark") {
    return (
      <Image
        src="/wordmark-gold.png"
        alt="Vision Menu"
        width={width}
        height={height}
        priority
        className="h-auto select-none"
      />
    )
  }

  if (variant === "light") {
    return (
      <Image
        src="/wordmark-wine.png"
        alt="Vision Menu"
        width={width}
        height={height}
        priority
        className="h-auto select-none"
      />
    )
  }

  return (
    <span className="inline-flex select-none">
      <Image
        src="/wordmark-wine.png"
        alt="Vision Menu"
        width={width}
        height={height}
        priority
        className="h-auto block dark:hidden"
      />
      <Image
        src="/wordmark-gold.png"
        alt="Vision Menu"
        width={width}
        height={height}
        priority
        className="h-auto hidden dark:block"
      />
    </span>
  )
}
