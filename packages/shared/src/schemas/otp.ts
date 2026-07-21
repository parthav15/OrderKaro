import { z } from "zod"

export const otpRequestSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, "Enter a 10-digit phone number"),
})

export const otpVerifySchema = z.object({
  phone: z.string().regex(/^\d{10}$/),
  name: z.string().min(1).max(100),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
})

export type OtpRequestInput = z.infer<typeof otpRequestSchema>
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>
