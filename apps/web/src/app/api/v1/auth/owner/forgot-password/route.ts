import { NextRequest } from "next/server"
import { randomInt } from "crypto"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { success, error, handleError, parseBody } from "@/lib/api-utils"
import { ownerForgotPasswordSchema } from "@orderkaro/shared"
import { isTwilioConfigured } from "@/lib/twilio"
import { dispatchOtp } from "@/lib/sms/otp"

const RESEND_COOLDOWN_MS = 30_000
const CODE_TTL_MS = 10 * 60_000

function toE164(phone: string): string {
  const trimmed = phone.trim()
  if (trimmed.startsWith("+")) return trimmed
  return "+91" + trimmed.replace(/\D/g, "").slice(-10)
}

function maskPhone(phone: string): string {
  return "•••••" + phone.replace(/\D/g, "").slice(-4)
}

export async function POST(request: NextRequest) {
  try {
    if (!isTwilioConfigured()) {
      return error("SMS verification is not configured", 503)
    }

    const body = await request.json()
    const { email } = parseBody(ownerForgotPasswordSchema, body)

    const owner = await prisma.owner.findUnique({
      where: { email },
      select: { phone: true },
    })
    if (!owner) return error("No account found with that email", 404)

    const existing = await prisma.phoneVerification.findUnique({
      where: { phone: owner.phone },
    })
    if (existing && Date.now() - existing.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
      return error("Please wait a moment before requesting another code", 429)
    }

    const code = String(randomInt(100000, 1000000))
    const codeHash = await bcrypt.hash(code, 8)
    const expiresAt = new Date(Date.now() + CODE_TTL_MS)

    await prisma.phoneVerification.upsert({
      where: { phone: owner.phone },
      create: { phone: owner.phone, codeHash, expiresAt, attempts: 0, lastSentAt: new Date() },
      update: { codeHash, expiresAt, attempts: 0, lastSentAt: new Date() },
    })

    await dispatchOtp(toE164(owner.phone), code, "reset")

    return success({ sent: true, phoneHint: maskPhone(owner.phone) })
  } catch (err) {
    return handleError(err)
  }
}
