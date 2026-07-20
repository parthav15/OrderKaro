import { NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import {
  success,
  error,
  handleError,
  generateAccessToken,
  generateRefreshToken,
  parseBody,
} from "@/lib/api-utils"
import { staffLoginSchema } from "@orderkaro/shared"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = parseBody(staffLoginSchema, body)

    const staff = await prisma.staff.findUnique({
      where: {
        restaurantId_email: {
          restaurantId: data.restaurantId,
          email: data.email,
        },
      },
      select: {
        id: true,
        name: true,
        role: true,
        restaurantId: true,
        isActive: true,
        passwordHash: true,
      },
    })

    if (!staff) {
      return error("Invalid credentials", 401)
    }

    if (!staff.isActive) {
      return error("Account is deactivated", 403)
    }

    const passwordMatch = await bcrypt.compare(data.password, staff.passwordHash)
    if (!passwordMatch) {
      return error("Invalid credentials", 401)
    }

    const accessToken = generateAccessToken({
      id: staff.id,
      role: staff.role,
      restaurantId: staff.restaurantId,
    })
    const refreshToken = generateRefreshToken({
      id: staff.id,
      role: staff.role,
      restaurantId: staff.restaurantId,
    })

    return success({
      staff: { id: staff.id, name: staff.name, role: staff.role, restaurantId: staff.restaurantId },
      accessToken,
      refreshToken,
    })
  } catch (err) {
    return handleError(err)
  }
}
