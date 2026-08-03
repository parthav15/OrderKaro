import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError, requireRole, AuthError } from "@/lib/api-utils"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; exemptionId: string }> }
) {
  try {
    const { id: restaurantId, exemptionId } = await params
    requireRole(request, "OWNER", "MANAGER")

    const exemption = await prisma.deliveryFeeExemption.findFirst({
      where: { id: exemptionId, restaurantId },
    })
    if (!exemption) throw new AuthError("Exemption not found", 404)

    await prisma.deliveryFeeExemption.delete({ where: { id: exemptionId } })

    return success({ message: "Exemption removed" })
  } catch (err) {
    return handleError(err)
  }
}
