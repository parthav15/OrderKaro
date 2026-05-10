import { z } from "zod"

export const createTableSchema = z.object({
  label: z.string().min(1).max(50),
  section: z.string().max(100).optional(),
  posX: z.number().nullable().optional(),
  posY: z.number().nullable().optional(),
})

export const updateTableSchema = z
  .object({
    label: z.string().min(1).max(50),
    section: z.string().max(100).nullable(),
    isActive: z.boolean(),
    posX: z.number().nullable(),
    posY: z.number().nullable(),
  })
  .partial()

export const bulkUpdatePositionsSchema = z.object({
  positions: z
    .array(
      z.object({
        id: z.string().min(1),
        posX: z.number().nullable(),
        posY: z.number().nullable(),
      })
    )
    .min(1)
    .max(500),
})

export type CreateTableInput = z.infer<typeof createTableSchema>
export type UpdateTableInput = z.infer<typeof updateTableSchema>
export type BulkUpdatePositionsInput = z.infer<typeof bulkUpdatePositionsSchema>
