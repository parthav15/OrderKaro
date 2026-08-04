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
  CONSUMER_ACCESS_EXPIRY,
} from "@/lib/api-utils"
import { otpVerifySchema } from "@orderkaro/shared"

const MAX_ATTEMPTS = 5

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, name, code } = parseBody(otpVerifySchema, body)

    const record = await prisma.phoneVerification.findUnique({ where: { phone } })
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
        where: { phone },
        data: { attempts: { increment: 1 } },
      })
      return error("Incorrect code", 400)
    }

    const consumer = await prisma.consumer.upsert({
      where: { phone },
      update: { name },
      create: { phone, name },
      select: { id: true, name: true, phone: true },
    })

    await prisma.phoneVerification.delete({ where: { phone } })

    const accessToken = generateAccessToken({ id: consumer.id, role: "CONSUMER" }, CONSUMER_ACCESS_EXPIRY)
    const refreshToken = generateRefreshToken({ id: consumer.id, role: "CONSUMER" })

    return success({ consumer, accessToken, refreshToken })
  } catch (err) {
    return handleError(err)
  }
}
