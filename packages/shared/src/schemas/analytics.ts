import { z } from "zod"

export const trackViewSchema = z.object({
  sessionId: z.string().min(8).max(64),
  menuItemId: z.string().min(1).optional(),
  source: z.enum(["MENU", "ITEM", "AR"]).default("MENU"),
})

export const modelRequestSchema = z.object({
  menuItemId: z.string().min(1),
  notes: z.string().max(500).optional(),
})

export const modelRequestUpdateSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "REJECTED"]),
  resultUrl: z.string().url().optional(),
})

export type TrackViewInput = z.infer<typeof trackViewSchema>
export type ModelRequestInput = z.infer<typeof modelRequestSchema>
export type ModelRequestUpdateInput = z.infer<typeof modelRequestUpdateSchema>
