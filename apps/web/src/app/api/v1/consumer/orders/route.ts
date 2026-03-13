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

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { consumerId: user.id },
        include: {
          items: {
            include: {
              menuItem: { select: { name: true } },
            },
          },
          table: { select: { label: true } },
          canteen: { select: { name: true, slug: true } },
        },
        orderBy: { placedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where: { consumerId: user.id } }),
    ])

    return NextResponse.json({
      success: true,
      data: orders,
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
