import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError, requireRole } from "@/lib/api-utils"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params
    requireRole(request, "OWNER", "MANAGER")

    const requests = await prisma.walletTransaction.findMany({
      where: {
        source: "BANK_TRANSFER",
        status: "PENDING",
      },
      include: {
        wallet: {
          include: {
            consumer: { select: { id: true, name: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return success(requests)
  } catch (err) {
    return handleError(err)
  }
}
