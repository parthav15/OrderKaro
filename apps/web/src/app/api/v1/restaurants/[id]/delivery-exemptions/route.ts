import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, created, handleError, requireRole, parseBody, AuthError } from "@/lib/api-utils"
import { deliveryExemptionSchema } from "@orderkaro/shared"
import { normalizePhone } from "@/lib/delivery-exemptions"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params
    requireRole(request, "OWNER", "MANAGER")

    const exemptions = await prisma.deliveryFeeExemption.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
    })

    return success(exemptions)
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params
    requireRole(request, "OWNER", "MANAGER")

    const body = await request.json()
    const data = parseBody(deliveryExemptionSchema, body)
    const phone = normalizePhone(data.phone)
    if (phone.length < 10) throw new AuthError("Enter a valid 10-digit phone number", 422)
    const label = data.label?.trim() || null

    const exemption = await prisma.deliveryFeeExemption.upsert({
      where: { restaurantId_phone: { restaurantId, phone } },
      create: { restaurantId, phone, label },
      update: { label },
    })

    return created(exemption)
  } catch (err) {
    return handleError(err)
  }
}
