import { z } from "zod"

export const connectPaypurSchema = z.object({
  apiKey: z.string().min(16).max(200),
  signingSecret: z.string().min(16).max(400),
})

export const connectStripeSchema = z.object({
  secretKey: z.string().min(20).max(300).regex(/^(sk|rk)_(live|test)_/, "Enter a Stripe secret key"),
})

export const connectCashfreeSchema = z.object({
  appId: z.string().min(6).max(120),
  secretKey: z.string().min(10).max(200).regex(/^cfsk_/, "Enter a Cashfree secret key (starts with cfsk_)"),
})

export const commissionSchema = z.object({
  commissionPercent: z.number().min(0).max(30),
})

export type ConnectPaypurInput = z.infer<typeof connectPaypurSchema>
export type ConnectStripeInput = z.infer<typeof connectStripeSchema>
export type ConnectCashfreeInput = z.infer<typeof connectCashfreeSchema>
export type CommissionInput = z.infer<typeof commissionSchema>
