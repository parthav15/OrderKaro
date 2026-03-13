import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, error, handleError, requireRole } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, "CONSUMER")

    let wallet = await prisma.wallet.findUnique({
      where: { consumerId: user.id },
      select: { id: true, balance: true, updatedAt: true },
    })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { consumerId: user.id },
        select: { id: true, balance: true, updatedAt: true },
      })
    }

    return success(wallet)
  } catch (err) {
    return handleError(err)
  }
}
