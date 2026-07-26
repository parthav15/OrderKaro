import { NextRequest } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { success, handleError, parseBody, AuthError } from "@/lib/api-utils"
import { requireSuperAdmin } from "@/lib/require-super-admin"

const smsConfigSchema = z.object({
  smsEnabled: z.boolean().optional(),
  smsMarginPercent: z.number().min(0).max(1000).optional(),
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
    const data = parseBody(smsConfigSchema, body)
    const updated = await prisma.restaurant.update({
      where: { id: restaurantId },
      data,
    })
    return success({
      id: updated.id,
      smsEnabled: updated.smsEnabled,
      smsMarginPercent: Number(updated.smsMarginPercent.toString()),
    })
  } catch (err) {
    return handleError(err)
  }
}
