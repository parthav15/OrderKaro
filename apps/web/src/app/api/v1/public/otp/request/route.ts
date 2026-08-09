import { NextRequest } from "next/server"
import { randomInt } from "crypto"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { success, error, handleError, parseBody } from "@/lib/api-utils"
import { otpRequestSchema } from "@orderkaro/shared"
import { isTwilioConfigured } from "@/lib/twilio"
import { dispatchOtp } from "@/lib/sms/otp"
import { isReviewOtpBypass } from "@/lib/review-bypass"

const RESEND_COOLDOWN_MS = 30_000
const CODE_TTL_MS = 10 * 60_000

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone } = parseBody(otpRequestSchema, body)

    if (isReviewOtpBypass(phone)) {
      return success({ sent: true })
    }

    if (!isTwilioConfigured()) {
      return error("SMS verification is not configured", 503)
    }

    const existing = await prisma.phoneVerification.findUnique({ where: { phone } })
    if (existing && Date.now() - existing.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
      return error("Please wait a moment before requesting another code", 429)
    }

    const code = String(randomInt(100000, 1000000))
    const codeHash = await bcrypt.hash(code, 8)
    const expiresAt = new Date(Date.now() + CODE_TTL_MS)

    await prisma.phoneVerification.upsert({
      where: { phone },
      create: { phone, codeHash, expiresAt, attempts: 0, lastSentAt: new Date() },
      update: { codeHash, expiresAt, attempts: 0, lastSentAt: new Date() },
    })

    await dispatchOtp(`+91${phone}`, code, "verify")

    return success({ sent: true })
  } catch (err) {
    return handleError(err)
  }
}
