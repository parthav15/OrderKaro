import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError, requireRole } from "@/lib/api-utils"
import { getOrCreateWallet } from "@/lib/wallet"

export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, "CONSUMER")
    const url = new URL(request.url)
    const restaurantId = url.searchParams.get("restaurantId")
    const slug = url.searchParams.get("slug")

    let resolvedRestaurantId = restaurantId
    if (!resolvedRestaurantId && slug) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { slug },
        select: { id: true },
      })
      resolvedRestaurantId = restaurant?.id ?? null
    }

    if (resolvedRestaurantId) {
      const wallet = await getOrCreateWallet(user.id, resolvedRestaurantId)
      return success({ id: wallet.id, balance: wallet.balance, updatedAt: wallet.updatedAt })
    }

    const wallets = await prisma.wallet.findMany({
      where: { consumerId: user.id },
      select: {
        id: true,
        balance: true,
        updatedAt: true,
        restaurant: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { updatedAt: "desc" },
    })

    return success({ wallets })
  } catch (err) {
    return handleError(err)
  }
}
