import { z } from "zod"

export const createRestaurantSchema = z.object({
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
  acceptsWallet: z.boolean().default(true),
  acceptsCash: z.boolean().default(true),
  acceptsOnline: z.boolean().default(true),
})

export const updateRestaurantSchema = createRestaurantSchema.partial()

export const paymentMethodsSchema = z
  .object({
    acceptsWallet: z.boolean(),
    acceptsCash: z.boolean(),
    acceptsOnline: z.boolean(),
  })
  .refine((v) => v.acceptsWallet || v.acceptsCash || v.acceptsOnline, {
    message: "At least one payment method must stay enabled",
  })

export type PaymentMethodsInput = z.infer<typeof paymentMethodsSchema>

export const brandingSchema = z.object({
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour like #DC2626"),
  themeMode: z.enum(["LIGHT", "DARK"]),
  logoUrl: z.string().url().nullable().optional(),
})

export const deliveryZoneSchema = z.object({
  deliveryEnabled: z.boolean(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  deliveryRadiusKm: z.number().min(0.1).max(50),
  deliveryFee: z.number().min(0).max(10000),
  minOrderValue: z.number().min(0).max(100000),
})

export type BrandingInput = z.infer<typeof brandingSchema>
export type DeliveryZoneInput = z.infer<typeof deliveryZoneSchema>

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>
