export type SmsEncoding = "GSM7" | "UCS2"

const GSM7_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ ÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà"
const GSM7_EXTENDED = "^{}\\[~]|€"

const basicSet = new Set(Array.from(GSM7_BASIC))
const extendedSet = new Set(Array.from(GSM7_EXTENDED))

export interface SmsAnalysis {
  encoding: SmsEncoding
  segments: number
  length: number
}

export function analyzeSms(body: string): SmsAnalysis {
  let septets = 0
  let isGsm7 = true
  for (const char of body) {
    if (basicSet.has(char)) {
      septets += 1
    } else if (extendedSet.has(char)) {
      septets += 2
    } else {
      isGsm7 = false
      break
    }
  }

  if (isGsm7) {
    const segments = septets <= 160 ? 1 : Math.ceil(septets / 153)
    return { encoding: "GSM7", segments: Math.max(segments, 1), length: septets }
  }

  const units = body.length
  const segments = units <= 70 ? 1 : Math.ceil(units / 67)
  return { encoding: "UCS2", segments: Math.max(segments, 1), length: units }
}
