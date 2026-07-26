import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError } from "@/lib/api-utils"
import { requireSuperAdmin } from "@/lib/require-super-admin"

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request)
    const [restaurants, usage] = await Promise.all([
      prisma.restaurant.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          smsEnabled: true,
          smsMarginPercent: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.smsMessage.groupBy({
        by: ["restaurantId"],
        where: { billingStatus: { in: ["PENDING", "BILLED"] } },
        _count: { _all: true },
        _sum: { sellAmount: true, marginAmount: true },
      }),
    ])

    const usageMap = new Map(
      usage.map((u) => [
        u.restaurantId,
        {
          smsSent: u._count._all,
          totalSellAmount: Number(u._sum.sellAmount ?? 0),
          totalMarginAmount: Number(u._sum.marginAmount ?? 0),
        },
      ])
    )

    const rows = restaurants.map((r) => {
      const restaurantUsage = usageMap.get(r.id)
      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        smsEnabled: r.smsEnabled,
        smsMarginPercent: Number(r.smsMarginPercent.toString()),
        smsSent: restaurantUsage?.smsSent ?? 0,
        totalSellAmount: restaurantUsage?.totalSellAmount ?? 0,
        totalMarginAmount: restaurantUsage?.totalMarginAmount ?? 0,
      }
    })

    return success({ restaurants: rows })
  } catch (err) {
    return handleError(err)
  }
}
