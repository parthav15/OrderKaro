import { NextRequest } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { success, handleError, parseBody } from "@/lib/api-utils"
import { requireSuperAdmin } from "@/lib/require-super-admin"
import type { SmsNotificationKey } from "@orderkaro/shared"

const whatsappTemplatesSchema = z.object({
  ORDER_PLACED: z.string().optional(),
  ORDER_ACCEPTED: z.string().optional(),
  ORDER_PREPARING: z.string().optional(),
  ORDER_READY: z.string().optional(),
  ORDER_COMPLETED: z.string().optional(),
  ORDER_CANCELLED: z.string().optional(),
  OWNER_NEW_ORDER: z.string().optional(),
})

const smsSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  baseCostPerSegment: z.number().min(0).max(1000).optional(),
  defaultMarginPercent: z.number().min(0).max(1000).optional(),
  whatsappEnabled: z.boolean().optional(),
  whatsappSender: z.string().max(64).optional(),
  whatsappCostPerMessage: z.number().min(0).max(1000).optional(),
  whatsappTemplates: whatsappTemplatesSchema.optional(),
})

function serializeSettings(settings: {
  enabled: boolean
  baseCostPerSegment: { toString(): string }
  defaultMarginPercent: { toString(): string }
  currency: string
  whatsappEnabled: boolean
  whatsappSender: string | null
  whatsappCostPerMessage: { toString(): string }
  whatsappTemplates: unknown
}) {
  return {
    enabled: settings.enabled,
    baseCostPerSegment: Number(settings.baseCostPerSegment.toString()),
    defaultMarginPercent: Number(settings.defaultMarginPercent.toString()),
    currency: settings.currency,
    whatsappEnabled: settings.whatsappEnabled,
    whatsappSender: settings.whatsappSender ?? "",
    whatsappCostPerMessage: Number(settings.whatsappCostPerMessage.toString()),
    whatsappTemplates: (settings.whatsappTemplates as Partial<Record<SmsNotificationKey, string>> | null) ?? {},
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request)
    const existing = await prisma.smsSettings.findUnique({ where: { id: "singleton" } })
    const settings = existing ?? (await prisma.smsSettings.create({ data: { id: "singleton" } }))
    return success(serializeSettings(settings))
  } catch (err) {
    return handleError(err)
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireSuperAdmin(request)
    const body = await request.json()
    const data = parseBody(smsSettingsSchema, body)
    const settings = await prisma.smsSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", ...data },
      update: data,
    })
    return success(serializeSettings(settings))
  } catch (err) {
    return handleError(err)
  }
}
