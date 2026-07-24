import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, error, handleError, parseBody } from "@/lib/api-utils"
import { requireSuperAdmin } from "@/lib/require-super-admin"
import { modelRequestUpdateSchema } from "@orderkaro/shared"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reqId: string }> }
) {
  try {
    const { reqId } = await params
    await requireSuperAdmin(request)

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
