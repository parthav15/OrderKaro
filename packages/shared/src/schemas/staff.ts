import { z } from "zod"

export const createStaffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
  name: z.string().min(2).max(100),
  role: z.enum(["MANAGER", "KITCHEN", "COUNTER"]),
  pin: z.string().length(4).optional(),
})

export const updateStaffSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(["MANAGER", "KITCHEN", "COUNTER"]).optional(),
  pin: z.string().length(4).optional(),
})

export type CreateStaffInput = z.infer<typeof createStaffSchema>
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>
