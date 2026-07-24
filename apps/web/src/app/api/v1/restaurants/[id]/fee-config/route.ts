import { NextRequest } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { success, handleError, requireRole, parseBody, AuthError } from "@/lib/api-utils"

const ownerFeeSchema = z.object({
  deliveryFeeEnabled: z.boolean(),
  deliveryFeeMode: z.enum(["FLAT", "PERCENT"]),
  deliveryFeeAmount: z.number().min(0).max(100000),
  convenienceFeeEnabled: z.boolean(),
  convenienceFeeMode: z.enum(["FLAT", "PERCENT"]),
  convenienceFeeAmount: z.number().min(0).max(100000),
})

type FeeConfigRow = Awaited<ReturnType<typeof prisma.restaurantFeeConfig.findUnique>>

function serialize(config: FeeConfigRow) {
  return {
    deliveryFeeEnabled: config?.deliveryFeeEnabled ?? false,
    deliveryFeeMode: config?.deliveryFeeMode ?? "FLAT",
    deliveryFeeAmount: Number((config?.deliveryFeeAmount ?? 0).toString()),
    deliveryFeeBeneficiary: config?.deliveryFeeBeneficiary ?? "RESTAURANT",
    convenienceFeeEnabled: config?.convenienceFeeEnabled ?? false,
    convenienceFeeMode: config?.convenienceFeeMode ?? "FLAT",
    convenienceFeeAmount: Number((config?.convenienceFeeAmount ?? 0).toString()),
    convenienceFeeBeneficiary: config?.convenienceFeeBeneficiary ?? "RESTAURANT",
  }
}

async function ownedRestaurant(request: NextRequest, id: string) {
  const user = requireRole(request, "OWNER")
  const restaurant = await prisma.restaurant.findFirst({ where: { id, ownerId: user.id } })
  if (!restaurant) throw new AuthError("Restaurant not found", 404)
  return restaurant
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await ownedRestaurant(request, id)
    const config = await prisma.restaurantFeeConfig.findUnique({ where: { restaurantId: id } })
    return success(serialize(config))
  } catch (err) {
    return handleError(err)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await ownedRestaurant(request, id)
    const body = await request.json()
    const data = parseBody(ownerFeeSchema, body)
    const config = await prisma.restaurantFeeConfig.upsert({
      where: { restaurantId: id },
      create: { restaurantId: id, ...data },
      update: data,
    })
    return success(serialize(config))
  } catch (err) {
    return handleError(err)
  }
}
