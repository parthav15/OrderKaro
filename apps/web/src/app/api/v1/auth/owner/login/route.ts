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
import { ownerLoginSchema } from "@orderkaro/shared"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = parseBody(ownerLoginSchema, body)

    const owner = await prisma.owner.findUnique({
      where: { email: data.email },
      select: { id: true, name: true, email: true, passwordHash: true },
    })

    if (!owner) {
      return error("Invalid credentials", 401)
    }

    const passwordMatch = await bcrypt.compare(data.password, owner.passwordHash)
    if (!passwordMatch) {
      return error("Invalid credentials", 401)
    }

    const accessToken = generateAccessToken({ id: owner.id, role: "OWNER" })
    const refreshToken = generateRefreshToken({ id: owner.id, role: "OWNER" })

    return success({
      owner: { id: owner.id, name: owner.name, email: owner.email },
      accessToken,
      refreshToken,
    })
  } catch (err) {
    return handleError(err)
  }
}
