import { z } from "zod"

export const createAnnouncementSchema = z.object({
  message: z.string().min(1).max(500),
  isActive: z.boolean().default(true),
  expiresAt: z.string().datetime().optional(),
})

export const updateAnnouncementSchema = createAnnouncementSchema.partial()

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>
