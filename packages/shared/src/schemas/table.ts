import { z } from "zod"

export const createTableSchema = z.object({
  label: z.string().min(1).max(50),
  section: z.string().max(100).optional(),
})

export const updateTableSchema = createTableSchema.partial()

export type CreateTableInput = z.infer<typeof createTableSchema>
export type UpdateTableInput = z.infer<typeof updateTableSchema>
