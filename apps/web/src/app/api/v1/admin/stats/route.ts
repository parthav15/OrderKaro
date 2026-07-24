import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError } from "@/lib/api-utils"
import { requireSuperAdmin } from "@/lib/require-super-admin"

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request)

    const [
      totalOwners,
      totalRestaurants,
      activeRestaurants,
      totalOrders,
      revenueResult,
      marginResult,
      marketplaceRestaurants,
    ] = await Promise.all([
      prisma.owner.count(),
      prisma.restaurant.count(),
      prisma.restaurant.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { totalAmount: true } }),
      prisma.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { platformFee: true } }),
      prisma.restaurantPaymentAccount.count({ where: { collectionMode: "MARKETPLACE" } }),
    ])

    return success({
      totalOwners,
      totalRestaurants,
      activeRestaurants,
      totalOrders,
      totalRevenue: revenueResult._sum.totalAmount ?? 0,
      platformRevenue: marginResult._sum.platformFee ?? 0,
      marketplaceRestaurants,
    })
  } catch (err) {
    return handleError(err)
  }
}
