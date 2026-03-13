import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError, requireRole, AuthError } from "@/lib/api-utils"
import type { JwtPayload } from "@orderkaro/shared"

async function verifySuperAdmin(user: JwtPayload) {
  if (user.role !== "OWNER") throw new AuthError("Super admin access required", 403)
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@orderkaro.com"
  const owner = await prisma.owner.findUnique({ where: { id: user.id }, select: { email: true } })
  if (!owner || owner.email !== superAdminEmail) throw new AuthError("Super admin access required", 403)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ownerId: string }> }
) {
  try {
    const { ownerId } = await params
    const user = requireRole(request, "OWNER")
    await verifySuperAdmin(user)

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
