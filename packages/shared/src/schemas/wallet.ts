import { z } from "zod"

export const rechargeRequestSchema = z.object({
  amount: z.number().positive(),
  reference: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
})

export const creditWalletSchema = z.object({
  consumerId: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().max(500).optional(),
})

export const approveRechargeSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().max(300).optional(),
})

export type RechargeRequestInput = z.infer<typeof rechargeRequestSchema>
export type CreditWalletInput = z.infer<typeof creditWalletSchema>
export type ApproveRechargeInput = z.infer<typeof approveRechargeSchema>
