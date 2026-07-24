import { NextRequest } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { success, handleError, parseBody, AuthError } from "@/lib/api-utils"
import { requireSuperAdmin } from "@/lib/require-super-admin"

const beneficiarySchema = z.object({
  deliveryFeeBeneficiary: z.enum(["RESTAURANT", "PLATFORM"]),
  convenienceFeeBeneficiary: z.enum(["RESTAURANT", "PLATFORM"]),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    await requireSuperAdmin(request)
    const { restaurantId } = await params
    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } })
    if (!restaurant) throw new AuthError("Restaurant not found", 404)
    const body = await request.json()
    const data = parseBody(beneficiarySchema, body)
    const config = await prisma.restaurantFeeConfig.upsert({
      where: { restaurantId },
      create: { restaurantId, ...data },
      update: data,
    })
    return success({
      deliveryFeeBeneficiary: config.deliveryFeeBeneficiary,
      convenienceFeeBeneficiary: config.convenienceFeeBeneficiary,
    })
  } catch (err) {
    return handleError(err)
  }
}
