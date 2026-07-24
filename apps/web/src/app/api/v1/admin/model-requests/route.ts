import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError } from "@/lib/api-utils"
import { requireSuperAdmin } from "@/lib/require-super-admin"

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request)

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
