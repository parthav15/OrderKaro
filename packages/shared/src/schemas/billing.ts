import { z } from "zod"

export const planSchema = z.enum(["FREE", "BASIC", "PRO"])

export const billingCheckoutSchema = z.object({
  plan: z.enum(["FREE", "BASIC", "PRO"]),
})

export const billingVerifySchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
})

export type Plan = z.infer<typeof planSchema>
export type BillingCheckoutInput = z.infer<typeof billingCheckoutSchema>
export type BillingVerifyInput = z.infer<typeof billingVerifySchema>
