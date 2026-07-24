import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { requireRole, AuthError } from "@/lib/api-utils"

export async function requireSuperAdmin(request: NextRequest) {
  const user = requireRole(request, "OWNER")
  const owner = await prisma.owner.findUnique({
    where: { id: user.id },
    select: { isSuperAdmin: true },
  })
  if (!owner?.isSuperAdmin) {
    throw new AuthError("Super admin access required", 403)
  }
  return user
}
