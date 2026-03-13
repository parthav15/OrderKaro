import { z } from "zod"

export const createCanteenSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  address: z.string().max(300).optional(),
  phone: z.string().min(10).max(15).optional(),
  openingTime: z.string().regex(/^\d{2}:\d{2}$/),
  closingTime: z.string().regex(/^\d{2}:\d{2}$/),
  avgPrepTime: z.number().int().min(1).max(120).default(15),
})

export const updateCanteenSchema = createCanteenSchema.partial()

export type CreateCanteenInput = z.infer<typeof createCanteenSchema>
export type UpdateCanteenInput = z.infer<typeof updateCanteenSchema>
