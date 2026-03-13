import { NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import {
  success,
  created,
  error,
  handleError,
  generateAccessToken,
  generateRefreshToken,
  parseBody,
} from "@/lib/api-utils"
import { ownerRegisterSchema } from "@orderkaro/shared"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = parseBody(ownerRegisterSchema, body)

    const existing = await prisma.owner.findUnique({ where: { email: data.email } })
    if (existing) {
      return error("Email already registered", 409)
    }

    const passwordHash = await bcrypt.hash(data.password, 12)

    const owner = await prisma.owner.create({
      data: {
        email: data.email,
        name: data.name,
        phone: data.phone,
        passwordHash,
      },
      select: { id: true, name: true, email: true },
    })

    const accessToken = generateAccessToken({ id: owner.id, role: "OWNER" })
    const refreshToken = generateRefreshToken({ id: owner.id, role: "OWNER" })

    return created({ owner, accessToken, refreshToken })
  } catch (err) {
    return handleError(err)
  }
}
