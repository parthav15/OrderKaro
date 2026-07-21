const TWILIO_API = "https://api.twilio.com/2010-04-01"

export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER
  )
}

export async function sendSms(to: string, body: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID as string
  const token = process.env.TWILIO_AUTH_TOKEN as string
  const from = process.env.TWILIO_FROM_NUMBER as string

  const auth = Buffer.from(`${sid}:${token}`).toString("base64")
  const form = new URLSearchParams({ To: to, From: from, Body: body })

  const res = await fetch(`${TWILIO_API}/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  })

  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as { message?: string } | null
    throw new Error(detail?.message || `Twilio send failed (${res.status})`)
  }
}
