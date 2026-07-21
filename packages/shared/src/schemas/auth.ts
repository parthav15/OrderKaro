import { z } from "zod"

export const ownerRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(100),
  phone: z.string().min(10).max(15),
})

export const ownerLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const staffLoginSchema = z.object({
  restaurantId: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
})

export const staffPinLoginSchema = z.object({
  restaurantId: z.string().min(1),
  pin: z.string().length(4),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
})

export const ownerForgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const ownerResetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
  password: z.string().min(8).max(128),
})

export type OwnerRegisterInput = z.infer<typeof ownerRegisterSchema>
export type OwnerLoginInput = z.infer<typeof ownerLoginSchema>
export type StaffLoginInput = z.infer<typeof staffLoginSchema>
export type StaffPinLoginInput = z.infer<typeof staffPinLoginSchema>
export type OwnerForgotPasswordInput = z.infer<typeof ownerForgotPasswordSchema>
export type OwnerResetPasswordInput = z.infer<typeof ownerResetPasswordSchema>
