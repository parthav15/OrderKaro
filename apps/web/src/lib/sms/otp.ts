import { sendSms, sendWhatsAppTemplate, getMessageStatus } from "@/lib/twilio"
import { getSmsSettings } from "@/lib/sms/charge"

export type OtpPurpose = "verify" | "reset"

export type OtpChannel = "WHATSAPP" | "SMS"

const DELIVERY_POLL_ATTEMPTS = 5
const DELIVERY_POLL_INTERVAL_MS = 800
const DELIVERED_STATES = new Set(["sent", "delivered", "read", "receiving", "received"])
const FAILED_STATES = new Set(["undelivered", "failed", "canceled"])

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function otpSmsBody(code: string, purpose: OtpPurpose): string {
  const label = purpose === "reset" ? "password reset code" : "verification code"
  return `Your Vision Menu ${label} is ${code}. It expires in 10 minutes.`
}

async function whatsappDelivered(sid: string | null): Promise<boolean> {
  if (!sid) return true
  for (let attempt = 0; attempt < DELIVERY_POLL_ATTEMPTS; attempt++) {
    await delay(DELIVERY_POLL_INTERVAL_MS)
    const status = await getMessageStatus(sid).catch(() => null)
    if (status && DELIVERED_STATES.has(status)) return true
    if (status && FAILED_STATES.has(status)) return false
  }
  return true
}

async function sendSmsOtp(to: string, code: string, purpose: OtpPurpose): Promise<OtpChannel> {
  await sendSms(to, otpSmsBody(code, purpose))
  return "SMS"
}

export async function dispatchOtp(
  to: string,
  code: string,
  purpose: OtpPurpose
): Promise<{ channel: OtpChannel }> {
  const settings = await getSmsSettings()

  if (settings.whatsappEnabled && settings.whatsappSender && settings.whatsappOtpTemplate) {
    try {
      const { sid } = await sendWhatsAppTemplate(to, settings.whatsappSender, settings.whatsappOtpTemplate, {
        "1": code,
      })
      if (await whatsappDelivered(sid)) return { channel: "WHATSAPP" }
    } catch {
      return { channel: await sendSmsOtp(to, code, purpose) }
    }
    return { channel: await sendSmsOtp(to, code, purpose) }
  }

  return { channel: await sendSmsOtp(to, code, purpose) }
}
