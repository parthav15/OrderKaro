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

export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, "OWNER")
    await verifySuperAdmin(user)

    const owners = await prisma.owner.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isVerified: true,
        createdAt: true,
        canteens: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return success(owners)
  } catch (err) {
    return handleError(err)
  }
}
