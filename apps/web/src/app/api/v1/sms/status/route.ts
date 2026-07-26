import { NextRequest } from "next/server"
import crypto from "crypto"
import { Decimal } from "@prisma/client/runtime/library"
import prisma from "@/lib/prisma"

type DeliveryState = "DELIVERED" | "SENT" | "UNDELIVERED" | "FAILED"

const STATUS_MAP: Record<string, DeliveryState> = {
  delivered: "DELIVERED",
  sent: "SENT",
  undelivered: "UNDELIVERED",
  failed: "FAILED",
}

function signatureValid(
  url: string,
  params: Record<string, string>,
  signature: string,
  authToken: string
): boolean {
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join("")
  const expected = crypto.createHmac("sha1", authToken).update(Buffer.from(data, "utf-8")).digest("base64")
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const params: Record<string, string> = {}
    for (const [key, value] of form.entries()) {
      params[key] = typeof value === "string" ? value : ""
    }

    const sid = params.MessageSid || params.SmsSid
    if (!sid) return new Response("ok")

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const signature = request.headers.get("x-twilio-signature")
    if (appUrl && authToken && signature) {
      const callbackUrl = `${appUrl.replace(/\/$/, "")}/api/v1/sms/status`
      if (!signatureValid(callbackUrl, params, signature, authToken)) {
        return new Response("forbidden", { status: 403 })
      }
    }

    const record = await prisma.smsMessage.findUnique({ where: { twilioSid: sid } })
    if (!record) return new Response("ok")

    const messageStatus = (params.MessageStatus || params.SmsStatus || "").toLowerCase()
    const nextStatus = STATUS_MAP[messageStatus]
    if (!nextStatus) return new Response("ok")

    await prisma.smsMessage.update({
      where: { twilioSid: sid },
      data: {
        status: nextStatus,
        errorMessage: params.ErrorMessage || record.errorMessage,
        ...(nextStatus === "FAILED"
          ? {
              billingStatus: "VOID",
              costAmount: new Decimal(0),
              sellAmount: new Decimal(0),
              marginAmount: new Decimal(0),
            }
          : {}),
      },
    })

    return new Response("ok")
  } catch {
    return new Response("ok")
  }
}
