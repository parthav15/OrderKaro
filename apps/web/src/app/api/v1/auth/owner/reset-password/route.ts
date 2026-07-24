import { NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import {
  success,
  error,
  handleError,
  parseBody,
  generateAccessToken,
  generateRefreshToken,
} from "@/lib/api-utils"
import { ownerResetPasswordSchema } from "@orderkaro/shared"

const MAX_ATTEMPTS = 5

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code, password } = parseBody(ownerResetPasswordSchema, body)

    const owner = await prisma.owner.findUnique({ where: { email } })
    if (!owner) return error("No account found with that email", 404)

    const record = await prisma.phoneVerification.findUnique({ where: { phone: owner.phone } })
    if (!record) return error("Request a new code", 400)
    if (record.expiresAt.getTime() < Date.now()) {
      return error("This code has expired. Request a new one.", 400)
    }
    if (record.attempts >= MAX_ATTEMPTS) {
      return error("Too many attempts. Request a new code.", 429)
    }

    const match = await bcrypt.compare(code, record.codeHash)
    if (!match) {
      await prisma.phoneVerification.update({
        where: { phone: owner.phone },
        data: { attempts: { increment: 1 } },
      })
      return error("Incorrect code", 400)
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.owner.update({ where: { id: owner.id }, data: { passwordHash } })
    await prisma.phoneVerification.delete({ where: { phone: owner.phone } })

    const accessToken = generateAccessToken({ id: owner.id, role: "OWNER" })
    const refreshToken = generateRefreshToken({ id: owner.id, role: "OWNER" })

    return success({
      owner: { id: owner.id, name: owner.name, email: owner.email, isSuperAdmin: owner.isSuperAdmin },
      accessToken,
      refreshToken,
    })
  } catch (err) {
    return handleError(err)
  }
}
