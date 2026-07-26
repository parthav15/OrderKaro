import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError } from "@/lib/api-utils"
import { requireCron } from "@/lib/cron-auth"
import { dispatchSms } from "@/lib/sms/dispatch"
import { SMS_RESTAURANT_SELECT } from "@/lib/sms/templates"
import { PLANS, type PlanName } from "@/lib/plans"

const DAY_MS = 24 * 60 * 60 * 1000
const EXPIRY_WINDOW_DAYS = 3

function formatExpiry(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  })
}

export async function GET(request: NextRequest) {
  try {
    requireCron(request)
    const now = new Date()
    const windowEnd = new Date(now.getTime() + EXPIRY_WINDOW_DAYS * DAY_MS)
    const dedupeSince = new Date(now.getTime() - EXPIRY_WINDOW_DAYS * DAY_MS)

    const restaurants = await prisma.restaurant.findMany({
      where: {
        notifyOwnerPlanExpiring: true,
        plan: { not: "FREE" },
        planValidUntil: { gt: now, lte: windowEnd },
        OR: [{ smsEnabled: true }, { whatsappEnabled: true }],
      },
      select: {
        ...SMS_RESTAURANT_SELECT,
        plan: true,
        planValidUntil: true,
        owner: { select: { phone: true } },
      },
    })

    const smsCallbackUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/api/v1/sms/status`
      : undefined

    let sent = 0
    for (const restaurant of restaurants) {
      if (!restaurant.planValidUntil) continue

      const alreadyNotified = await prisma.smsMessage.findFirst({
        where: {
          restaurantId: restaurant.id,
          template: "OWNER_PLAN_EXPIRING",
          status: { not: "FAILED" },
          createdAt: { gte: dedupeSince },
        },
        select: { id: true },
      })
      if (alreadyNotified) continue

      const delivered = await dispatchSms({
        restaurant,
        key: "OWNER_PLAN_EXPIRING",
        toPhone: restaurant.owner.phone,
        context: {
          restaurantName: restaurant.name,
          planName: PLANS[restaurant.plan as PlanName]?.label ?? restaurant.plan,
          expiryDate: formatExpiry(restaurant.planValidUntil),
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
