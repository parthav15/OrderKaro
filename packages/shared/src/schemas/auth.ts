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
  canteenId: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
})

export const staffPinLoginSchema = z.object({
  canteenId: z.string().min(1),
  pin: z.string().length(4),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
})

export type OwnerRegisterInput = z.infer<typeof ownerRegisterSchema>
export type OwnerLoginInput = z.infer<typeof ownerLoginSchema>
export type StaffLoginInput = z.infer<typeof staffLoginSchema>
export type StaffPinLoginInput = z.infer<typeof staffPinLoginSchema>
