import { sendSms, sendWhatsAppTemplate } from "@/lib/twilio"
import { getSmsSettings } from "@/lib/sms/charge"

export type OtpPurpose = "verify" | "reset"

export type OtpChannel = "WHATSAPP" | "SMS"

function otpSmsBody(code: string, purpose: OtpPurpose): string {
  const label = purpose === "reset" ? "password reset code" : "verification code"
  return `Your Vision Menu ${label} is ${code}. It expires in 10 minutes.`
}

export async function dispatchOtp(
  to: string,
  code: string,
  purpose: OtpPurpose
): Promise<{ channel: OtpChannel }> {
  const settings = await getSmsSettings()

  if (settings.whatsappEnabled && settings.whatsappSender && settings.whatsappOtpTemplate) {
    try {
      await sendWhatsAppTemplate(to, settings.whatsappSender, settings.whatsappOtpTemplate, {
        "1": code,
      })
      return { channel: "WHATSAPP" }
    } catch {
      return { channel: await sendSmsOtp(to, code, purpose) }
    }
  }

  return { channel: await sendSmsOtp(to, code, purpose) }
}

async function sendSmsOtp(to: string, code: string, purpose: OtpPurpose): Promise<OtpChannel> {
  await sendSms(to, otpSmsBody(code, purpose))
  return "SMS"
}
