import { createHmac, timingSafeEqual } from "crypto"

const RAZORPAY_API = "https://api.razorpay.com/v1"

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
}

export async function createRazorpayOrder(amountInRupees: number, receipt: string) {
  const auth = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString("base64")
  const res = await fetch(`${RAZORPAY_API}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
    body: JSON.stringify({
      amount: Math.round(amountInRupees * 100),
      currency: "INR",
      receipt: receipt.slice(0, 40),
    }),
  })
  if (!res.ok) {
    throw new Error(`Razorpay order creation failed (${res.status}): ${await res.text()}`)
  }
  return (await res.json()) as { id: string; amount: number; currency: string }
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
    .update(`${orderId}|${paymentId}`)
    .digest("hex")
  const expectedBuf = Buffer.from(expected)
  const signatureBuf = Buffer.from(signature)
  return (
    expectedBuf.length === signatureBuf.length &&
    timingSafeEqual(expectedBuf, signatureBuf)
  )
}
