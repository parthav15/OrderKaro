import Image from "next/image"

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "light" | "dark"
  showText?: boolean
}

const sizeMap = {
  sm: { icon: 24, text: "text-lg" },
  md: { icon: 32, text: "text-xl" },
  lg: { icon: 40, text: "text-2xl" },
  xl: { icon: 48, text: "text-3xl" },
}

const iconMap = {
  light: "https://res.cloudinary.com/dpjw3fe8d/image/upload/v1773754276/orderkaro/branding/orderkaro-logo-icon.png",
  dark: "https://res.cloudinary.com/dpjw3fe8d/image/upload/v1773754289/orderkaro/branding/orderkaro-logo-dark.png",
}

export function Logo({ size = "md", variant = "light", showText = true }: LogoProps) {
  const s = sizeMap[size]
  const textColor = variant === "dark" ? "text-white" : "text-[#0A0A0A]"
  const redColor = variant === "dark" ? "text-[#DC2626]" : "text-[#DC2626]"

  return (
    <span className="inline-flex items-center gap-2 select-none">
      <Image
        src={iconMap[variant]}
        alt="OrderKaro"
        width={s.icon}
        height={s.icon}
        className="rounded-lg"
      />
      {showText && (
        <span className={`${s.text} font-extrabold tracking-tight ${textColor}`}>
          Order<span className={redColor}>Karo</span>
        </span>
      )}
    </span>
  )
}
