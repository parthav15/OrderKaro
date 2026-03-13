import { z } from "zod"

export const consumerRegisterSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(10).max(15),
  pin: z.string().length(4).optional(),
})

export const consumerLoginSchema = z.object({
  phone: z.string().min(10).max(15),
  pin: z.string().length(4),
})

export const identifyConsumerSchema = z.object({
  phone: z.string().min(10).max(10),
  name: z.string().min(1).max(100),
})

export type ConsumerRegisterInput = z.infer<typeof consumerRegisterSchema>
export type ConsumerLoginInput = z.infer<typeof consumerLoginSchema>
export type IdentifyConsumerInput = z.infer<typeof identifyConsumerSchema>
