import prisma from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"

export interface ComputedPlatformFees {
  deliveryFee: Decimal
  convenienceFee: Decimal
  total: Decimal
}

const ZERO = new Decimal(0)

export async function getPlatformConfig() {
  const existing = await prisma.platformConfig.findUnique({ where: { id: "singleton" } })
  if (existing) return existing
  return prisma.platformConfig.create({ data: { id: "singleton" } })
}

function applyFee(enabled: boolean, mode: string, amount: Decimal, base: Decimal): Decimal {
  if (!enabled) return ZERO
  return mode === "PERCENT" ? base.mul(amount).div(100) : amount
}

export async function computePlatformFees(
  subtotal: Decimal,
  orderType: string
): Promise<ComputedPlatformFees> {
  if (orderType !== "DELIVERY") {
    return { deliveryFee: ZERO, convenienceFee: ZERO, total: ZERO }
  }
  const config = await getPlatformConfig()
  const deliveryFee = applyFee(
    config.deliveryFeeEnabled,
    config.deliveryFeeMode,
    new Decimal(config.deliveryFeeAmount.toString()),
    subtotal
  )
  const convenienceFee = applyFee(
    config.convenienceFeeEnabled,
    config.convenienceFeeMode,
    new Decimal(config.convenienceFeeAmount.toString()),
    subtotal
  )
  return { deliveryFee, convenienceFee, total: deliveryFee.add(convenienceFee) }
}
