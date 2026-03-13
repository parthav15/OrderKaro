import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { handleError, requireRole } from "@/lib/api-utils"
import { NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, "CONSUMER")

    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")))

    const wallet = await prisma.wallet.findUnique({ where: { consumerId: user.id } })

    if (!wallet) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      })
    }

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
    ])

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    return handleError(err)
  }
}
