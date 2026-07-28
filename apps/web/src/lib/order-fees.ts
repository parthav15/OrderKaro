import prisma from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"

export interface OrderFeeBreakdown {
  deliveryFee: Decimal
  convenienceFee: Decimal
  total: Decimal
  restaurantShare: Decimal
  platformShare: Decimal
  configured: boolean
}

const ZERO = new Decimal(0)

function feeAmount(mode: string, amount: Decimal, base: Decimal): Decimal {
  const raw = mode === "PERCENT" ? base.mul(amount).div(100) : amount
  return raw.toDecimalPlaces(2)
}

export const EMPTY_ORDER_FEES: OrderFeeBreakdown = {
  deliveryFee: ZERO,
  convenienceFee: ZERO,
  total: ZERO,
  restaurantShare: ZERO,
  platformShare: ZERO,
  configured: false,
}

export async function computeOrderFees(
  restaurantId: string,
  subtotal: Decimal,
  orderType: string
): Promise<OrderFeeBreakdown> {
  if (orderType !== "DELIVERY") return EMPTY_ORDER_FEES

  const config = await prisma.restaurantFeeConfig.findUnique({ where: { restaurantId } })
  if (!config) return EMPTY_ORDER_FEES

  const deliveryFee = config.deliveryFeeEnabled
    ? feeAmount(config.deliveryFeeMode, new Decimal(config.deliveryFeeAmount.toString()), subtotal)
    : ZERO
  const convenienceFee = config.convenienceFeeEnabled
    ? feeAmount(config.convenienceFeeMode, new Decimal(config.convenienceFeeAmount.toString()), subtotal)
    : ZERO

  let platformShare = ZERO
  if (config.deliveryFeeEnabled && config.deliveryFeeBeneficiary === "PLATFORM") {
    platformShare = platformShare.add(deliveryFee)
  }
  if (config.convenienceFeeEnabled && config.convenienceFeeBeneficiary === "PLATFORM") {
    platformShare = platformShare.add(convenienceFee)
  }

  const total = deliveryFee.add(convenienceFee)
  return {
    deliveryFee,
    convenienceFee,
    total,
    restaurantShare: total.sub(platformShare),
    platformShare,
    configured: true,
  }
}
