import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError, requireRole, AuthError } from "@/lib/api-utils"
import { reconcilePendingPayments } from "@/lib/payments/confirm"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    requireRole(request, "OWNER", "MANAGER")

    const restaurant = await prisma.restaurant.findUnique({ where: { id } })
    if (!restaurant) throw new AuthError("Restaurant not found", 404)

    const result = await reconcilePendingPayments(id)
    return success(result)
  } catch (err) {
    return handleError(err)
  }
}
