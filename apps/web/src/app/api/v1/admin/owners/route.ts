import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError } from "@/lib/api-utils"
import { requireSuperAdmin } from "@/lib/require-super-admin"

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request)

    const owners = await prisma.owner.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isVerified: true,
        createdAt: true,
        restaurants: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return success(owners)
  } catch (err) {
    return handleError(err)
  }
}
