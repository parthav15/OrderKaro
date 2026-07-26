import { NextRequest } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { success, handleError, parseBody } from "@/lib/api-utils"
import { requireSuperAdmin } from "@/lib/require-super-admin"

const smsSettingsSchema = z.object({
  enabled: z.boolean(),
  baseCostPerSegment: z.number().min(0).max(1000),
  defaultMarginPercent: z.number().min(0).max(1000),
})

function serializeSettings(settings: {
  enabled: boolean
  baseCostPerSegment: { toString(): string }
  defaultMarginPercent: { toString(): string }
  currency: string
}) {
  return {
    enabled: settings.enabled,
    baseCostPerSegment: Number(settings.baseCostPerSegment.toString()),
    defaultMarginPercent: Number(settings.defaultMarginPercent.toString()),
    currency: settings.currency,
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
