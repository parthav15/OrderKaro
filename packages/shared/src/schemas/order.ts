import { z } from "zod"

export const orderItemSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().min(1).max(50),
  selectedOptions: z
    .array(
      z.object({
        customizationId: z.string().uuid(),
        optionIds: z.array(z.string().uuid()),
      })
    )
    .default([]),
  notes: z.string().max(200).optional(),
})

export const placeOrderSchema = z.object({
  tableId: z.string().uuid(),
  items: z.array(orderItemSchema).min(1),
  specialInstructions: z.string().max(500).optional(),
  paymentMethod: z.enum(["CASH", "WALLET"]),
  idempotencyKey: z.string().uuid(),
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
