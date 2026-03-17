import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, error, handleError, requireRole } from "@/lib/api-utils"

export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, "CONSUMER")
    const { token, platform } = await request.json()

    if (!token || !platform) {
      return error("token and platform are required", 422)
    }

    await prisma.deviceToken.upsert({
      where: { token },
      create: {
        consumerId: user.id,
        token,
        platform,
      },
      update: {
        consumerId: user.id,
        platform,
      },
    })

    return success({ registered: true })
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = requireRole(request, "CONSUMER")
    const { token } = await request.json()

    if (!token) {
      return error("token is required", 422)
    }

    await prisma.deviceToken.deleteMany({
      where: { token, consumerId: user.id },
    })

    return success({ removed: true })
  } catch (err) {
    return handleError(err)
  }
}
