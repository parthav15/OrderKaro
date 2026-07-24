import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError, AuthError } from "@/lib/api-utils"
import { requireSuperAdmin } from "@/lib/require-super-admin"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ownerId: string }> }
) {
  try {
    const { ownerId } = await params
    await requireSuperAdmin(request)

    const owner = await prisma.owner.findUnique({
      where: { id: ownerId },
      select: { id: true, isVerified: true },
    })
    if (!owner) throw new AuthError("Owner not found", 404)

    const updated = await prisma.owner.update({
      where: { id: ownerId },
      data: { isVerified: !owner.isVerified },
      select: {
        id: true,
        name: true,
        email: true,
        isVerified: true,
        updatedAt: true,
      },
    })

    return success(updated)
  } catch (err) {
    return handleError(err)
  }
}
