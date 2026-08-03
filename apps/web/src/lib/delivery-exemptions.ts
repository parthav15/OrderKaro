import prisma from "@/lib/prisma"

export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return ""
  const digits = phone.replace(/\D/g, "")
  return digits.length > 10 ? digits.slice(-10) : digits
}

export async function isDeliveryFeeExempt(
  restaurantId: string,
  phone: string | null | undefined
): Promise<boolean> {
  const normalized = normalizePhone(phone)
  if (normalized.length < 10) return false
  const match = await prisma.deliveryFeeExemption.findFirst({
    where: { restaurantId, phone: normalized },
    select: { id: true },
  })
  return Boolean(match)
}
