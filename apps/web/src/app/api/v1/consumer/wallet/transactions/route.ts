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

    const restaurantId = searchParams.get("restaurantId")
    const walletFilter = {
      wallet: { consumerId: user.id, ...(restaurantId && { restaurantId }) },
      NOT: { source: "ONLINE" as const, status: "PENDING" as const },
    }

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: walletFilter,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.walletTransaction.count({ where: walletFilter }),
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
