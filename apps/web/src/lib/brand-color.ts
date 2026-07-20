export const DEFAULT_BRAND_COLOR = "#A31D33"

export function hexToRgbTriplet(hex: string): string {
  const normalized = hex.trim().replace("#", "")
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return "163 29 51"
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  return `${r} ${g} ${b}`
}

export function readableTextColor(hex: string): string {
  const normalized = hex.trim().replace("#", "")
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return "#FFFFFF"
  const r = parseInt(normalized.slice(0, 2), 16) / 255
  const g = parseInt(normalized.slice(2, 4), 16) / 255
  const b = parseInt(normalized.slice(4, 6), 16) / 255
  const channel = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
  return luminance > 0.45 ? "#0A0A0A" : "#FFFFFF"
}

export const BRAND_COLOR_PRESETS = [
  "#A31D33",
  "#EA580C",
  "#CA8A04",
  "#16A34A",
  "#0891B2",
  "#2563EB",
  "#7C3AED",
  "#DB2777",
  "#0A0A0A",
]
