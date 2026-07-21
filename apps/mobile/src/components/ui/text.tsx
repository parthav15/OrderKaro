import { Text as RNText, type TextProps } from "react-native"

const variants = {
  display: "font-serif-italic text-ink",
  heading: "font-serif text-ink",
  title: "font-sans-bold text-ink",
  body: "font-sans text-ink",
  label: "font-sans-medium text-ink",
  muted: "font-sans text-muted",
  price: "font-serif text-accent",
} as const

type Variant = keyof typeof variants

export function Text({
  variant = "body",
  className = "",
  ...props
}: TextProps & { variant?: Variant }) {
  return <RNText className={`${variants[variant]} ${className}`} {...props} />
}
