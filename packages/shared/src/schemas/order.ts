import { z } from "zod"

export const orderItemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
  selectedOptions: z
    .array(
      z.object({
        customizationId: z.string().min(1),
        optionIds: z.array(z.string().min(1)),
      })
    )
    .default([]),
  notes: z.string().max(200).optional(),
})

export const placeOrderSchema = z
  .object({
    orderType: z.enum(["DINE_IN", "TAKEAWAY", "DELIVERY"]).default("DINE_IN"),
    tableId: z.string().min(1).optional(),
    deliveryLocation: z.string().min(1).max(200).optional(),
    deliveryLatitude: z.number().min(-90).max(90).optional(),
    deliveryLongitude: z.number().min(-180).max(180).optional(),
    items: z.array(orderItemSchema).min(1),
    specialInstructions: z.string().max(500).optional(),
    paymentMethod: z.enum(["CASH", "ONLINE"]),
    idempotencyKey: z.string().min(1),
  })
  .refine((d) => d.orderType !== "DINE_IN" || !!d.tableId, {
    message: "Table is required for dine-in orders",
    path: ["tableId"],
  })
  .refine((d) => d.orderType !== "DELIVERY" || !!d.deliveryLocation, {
    message: "Delivery location is required for delivery orders",
    path: ["deliveryLocation"],
  })

export const updateOrderStatusSchema = z.object({
  status: z.enum(["ACCEPTED", "PREPARING", "READY", "PICKED_UP", "CANCELLED"]),
  note: z.string().max(300).optional(),
})

export const collectCashPaymentSchema = z.object({
  amountReceived: z.number().positive(),
})

export type OrderItemInput = z.infer<typeof orderItemSchema>
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
export type CollectCashPaymentInput = z.infer<typeof collectCashPaymentSchema>
