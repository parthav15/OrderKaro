import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError } from "@/lib/api-utils"
import { requireCron } from "@/lib/cron-auth"
import { dispatchSms } from "@/lib/sms/dispatch"
import { SMS_RESTAURANT_SELECT } from "@/lib/sms/templates"

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

function istDayRange(now = new Date()) {
  const ist = new Date(now.getTime() + IST_OFFSET_MS)
  const midnightIstUtc = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate())
  const start = new Date(midnightIstUtc - IST_OFFSET_MS)
  const end = new Date(start.getTime() + DAY_MS - 1)
  return { start, end }
}

export async function GET(request: NextRequest) {
  try {
    requireCron(request)
    const { start, end } = istDayRange()

    const restaurants = await prisma.restaurant.findMany({
      where: {
        notifyOwnerDailySummary: true,
        OR: [{ smsEnabled: true }, { whatsappEnabled: true }],
      },
      select: { ...SMS_RESTAURANT_SELECT, owner: { select: { phone: true } } },
    })

    const smsCallbackUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/api/v1/sms/status`
      : undefined

    let sent = 0
    for (const restaurant of restaurants) {
      const [orderCount, revenue] = await Promise.all([
        prisma.order.count({
          where: {
            restaurantId: restaurant.id,
            status: { not: "AWAITING_PAYMENT" },
            placedAt: { gte: start, lte: end },
          },
        }),
        prisma.order.aggregate({
          where: {
            restaurantId: restaurant.id,
            paymentStatus: "PAID",
            placedAt: { gte: start, lte: end },
          },
          _sum: { totalAmount: true },
        }),
      ])

      if (orderCount === 0) continue

      const delivered = await dispatchSms({
        restaurant,
        key: "OWNER_DAILY_SUMMARY",
        toPhone: restaurant.owner.phone,
        context: {
          restaurantName: restaurant.name,
          orderCount,
          revenue: revenue._sum.totalAmount?.toFixed(2) ?? "0.00",
        },
        statusCallbackUrl: smsCallbackUrl,
      })
      if (delivered) sent += 1
    }

    return success({ processed: restaurants.length, sent })
  } catch (err) {
    return handleError(err)
  }
}
