import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
  success,
  error,
  handleError,
  requireRole,
  parseBody,
  AuthError,
} from "@/lib/api-utils"
import { modelRequestUpdateSchema } from "@orderkaro/shared"
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reqId: string }> }
) {
  try {
    const { reqId } = await params
    const user = requireRole(request, "OWNER")
    await verifySuperAdmin(user)

    const body = await request.json()
    const data = parseBody(modelRequestUpdateSchema, body)

    const modelRequest = await prisma.modelRequest.findUnique({ where: { id: reqId } })
    if (!modelRequest) return error("Model request not found", 404)

    if (data.status === "COMPLETED" && !data.resultUrl) {
      return error("A model URL is required to complete a request", 422)
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (data.status === "COMPLETED" && data.resultUrl) {
        await tx.menuItem.update({
          where: { id: modelRequest.menuItemId },
          data: { model3dUrl: data.resultUrl },
        })
      }
      return tx.modelRequest.update({
        where: { id: reqId },
        data: { status: data.status, resultUrl: data.resultUrl ?? modelRequest.resultUrl },
        include: {
          menuItem: { select: { id: true, name: true } },
          restaurant: { select: { id: true, name: true } },
        },
      })
    })

    return success(updated)
  } catch (err) {
    return handleError(err)
  }
}
