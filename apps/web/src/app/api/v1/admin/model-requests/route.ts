import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError, requireRole, AuthError } from "@/lib/api-utils"
import type { JwtPayload } from "@orderkaro/shared"

async function verifySuperAdmin(user: JwtPayload) {
  if (user.role !== "OWNER") throw new AuthError("Super admin access required", 403)
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@orderkaro.com"
  const owner = await prisma.owner.findUnique({
    where: { id: user.id },
    select: { email: true },
  })
  if (!owner || owner.email !== superAdminEmail)
    throw new AuthError("Super admin access required", 403)
}

export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, "OWNER")
    await verifySuperAdmin(user)

    const status = new URL(request.url).searchParams.get("status")

    const requests = await prisma.modelRequest.findMany({
      where: status ? { status: status as never } : undefined,
      include: {
        menuItem: { select: { id: true, name: true, imageUrl: true } },
        restaurant: { select: { id: true, name: true, slug: true, plan: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return success(requests)
  } catch (err) {
    return handleError(err)
  }
}
