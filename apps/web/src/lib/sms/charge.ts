import prisma from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"

export interface SmsCharge {
  costAmount: Decimal
  sellAmount: Decimal
  marginAmount: Decimal
  marginPercent: Decimal
  currency: string
}

export async function getSmsSettings() {
  return prisma.smsSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  })
}

export async function computeSmsCharge(
  marginPercent: Decimal | number | string,
  segments: number
): Promise<SmsCharge> {
  const settings = await getSmsSettings()
  const base = new Decimal(settings.baseCostPerSegment.toString())
  const cost = base.mul(segments).toDecimalPlaces(4)
  const pct = new Decimal(marginPercent.toString())
  const sell = cost.mul(pct.div(100).add(1)).toDecimalPlaces(4)
  const marginAmount = sell.sub(cost)
  return {
    costAmount: cost,
    sellAmount: sell,
    marginAmount,
    marginPercent: pct,
    currency: settings.currency,
  }
}
