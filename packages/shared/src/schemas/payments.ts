import { z } from "zod"

export const connectPaypurSchema = z.object({
  apiKey: z.string().min(16).max(200),
  signingSecret: z.string().min(16).max(400),
})

export const connectStripeSchema = z.object({
  secretKey: z.string().min(20).max(300).regex(/^(sk|rk)_(live|test)_/, "Enter a Stripe secret key"),
})

export const commissionSchema = z.object({
  commissionPercent: z.number().min(0).max(30),
})

export const walletTopupSchema = z.object({
  amount: z.number().min(1).max(100000),
})

export type WalletTopupInput = z.infer<typeof walletTopupSchema>

export type ConnectPaypurInput = z.infer<typeof connectPaypurSchema>
export type ConnectStripeInput = z.infer<typeof connectStripeSchema>
export type CommissionInput = z.infer<typeof commissionSchema>
