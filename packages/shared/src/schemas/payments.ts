import { z } from "zod"

export const connectPaypurSchema = z.object({
  apiKey: z.string().min(16).max(200),
  signingSecret: z.string().min(16).max(400),
})

export const commissionSchema = z.object({
  commissionPercent: z.number().min(0).max(30),
})

export type ConnectPaypurInput = z.infer<typeof connectPaypurSchema>
export type CommissionInput = z.infer<typeof commissionSchema>
