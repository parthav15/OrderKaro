const TWILIO_API = "https://api.twilio.com/2010-04-01"

export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER
  )
}

export async function sendSms(
  to: string,
  body: string,
  statusCallback?: string
): Promise<{ sid: string | null }> {
  const sid = process.env.TWILIO_ACCOUNT_SID as string
  const token = process.env.TWILIO_AUTH_TOKEN as string
  const from = process.env.TWILIO_FROM_NUMBER as string

  const auth = Buffer.from(`${sid}:${token}`).toString("base64")
  const params: Record<string, string> = { To: to, From: from, Body: body }
  if (statusCallback) params.StatusCallback = statusCallback
  const form = new URLSearchParams(params)

  const res = await fetch(`${TWILIO_API}/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  })

  const payload = (await res.json().catch(() => null)) as { sid?: string; message?: string } | null

  if (!res.ok) {
    throw new Error(payload?.message || `Twilio send failed (${res.status})`)
  }

  return { sid: payload?.sid ?? null }
}

export async function getMessageStatus(sid: string): Promise<string | null> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID as string
  const token = process.env.TWILIO_AUTH_TOKEN as string
  const auth = Buffer.from(`${accountSid}:${token}`).toString("base64")

  const res = await fetch(`${TWILIO_API}/Accounts/${accountSid}/Messages/${sid}.json`, {
    headers: { Authorization: `Basic ${auth}` },
  })
  if (!res.ok) return null
  const payload = (await res.json().catch(() => null)) as { status?: string } | null
  return payload?.status ?? null
}

function normalizeWhatsAppNumber(value: string): string {
  const trimmed = value.trim().replace(/^whatsapp:/i, "")
  return trimmed.startsWith("+") ? trimmed : `+${trimmed.replace(/\D/g, "")}`
}

export async function sendWhatsAppTemplate(
  to: string,
  sender: string,
  contentSid: string,
  variables: Record<string, string>,
  statusCallback?: string
): Promise<{ sid: string | null }> {
  const sid = process.env.TWILIO_ACCOUNT_SID as string
  const token = process.env.TWILIO_AUTH_TOKEN as string

  const auth = Buffer.from(`${sid}:${token}`).toString("base64")
  const params: Record<string, string> = {
    To: `whatsapp:${normalizeWhatsAppNumber(to)}`,
    From: `whatsapp:${normalizeWhatsAppNumber(sender)}`,
    ContentSid: contentSid,
    ContentVariables: JSON.stringify(variables),
  }
  if (statusCallback) params.StatusCallback = statusCallback

  const res = await fetch(`${TWILIO_API}/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params).toString(),
  })

  const payload = (await res.json().catch(() => null)) as { sid?: string; message?: string } | null

  if (!res.ok) {
    throw new Error(payload?.message || `WhatsApp send failed (${res.status})`)
  }

  return { sid: payload?.sid ?? null }
}
