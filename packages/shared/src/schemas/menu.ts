import { z } from "zod"

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().min(0).default(0),
})

export const updateCategorySchema = createCategorySchema.partial()

export const createMenuItemSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(150),
  description: z.string().max(500).optional(),
  price: z.number().positive(),
  imageUrl: z.string().url().optional(),
  isVeg: z.boolean().default(true),
  prepTimeMin: z.number().int().min(1).max(120).optional(),
  sortOrder: z.number().int().min(0).default(0),
  tags: z.array(z.string()).default([]),
})

export const updateMenuItemSchema = createMenuItemSchema.partial()

export const createCustomizationSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["SINGLE_SELECT", "MULTI_SELECT"]),
  isRequired: z.boolean().default(false),
  minSelect: z.number().int().min(0).default(0),
  maxSelect: z.number().int().min(1).default(1),
})

export const updateCustomizationSchema = createCustomizationSchema.partial()

export const createCustomizationOptionSchema = z.object({
  name: z.string().min(1).max(100),
  priceAdjustment: z.number().default(0),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
})

export const updateCustomizationOptionSchema = createCustomizationOptionSchema.partial()

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>
export type CreateCustomizationInput = z.infer<typeof createCustomizationSchema>
export type UpdateCustomizationInput = z.infer<typeof updateCustomizationSchema>
export type CreateCustomizationOptionInput = z.infer<typeof createCustomizationOptionSchema>
export type UpdateCustomizationOptionInput = z.infer<typeof updateCustomizationOptionSchema>
