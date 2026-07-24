import { NextRequest } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { success, handleError, parseBody } from "@/lib/api-utils"
import { requireSuperAdmin } from "@/lib/require-super-admin"
import { getPlatformConfig } from "@/lib/platform-fees"

const platformConfigSchema = z.object({
  deliveryFeeEnabled: z.boolean(),
  deliveryFeeMode: z.enum(["FLAT", "PERCENT"]),
  deliveryFeeAmount: z.number().min(0).max(100000),
  convenienceFeeEnabled: z.boolean(),
  convenienceFeeMode: z.enum(["FLAT", "PERCENT"]),
  convenienceFeeAmount: z.number().min(0).max(100000),
  minFee: z.number().min(0).max(100000),
  maxFee: z.number().min(0).max(100000).nullable(),
})

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request)
    const config = await getPlatformConfig()
    return success(config)
  } catch (err) {
    return handleError(err)
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireSuperAdmin(request)
    const body = await request.json()
    const data = parseBody(platformConfigSchema, body)
    const config = await prisma.platformConfig.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", ...data },
      update: data,
    })
    return success(config)
  } catch (err) {
    return handleError(err)
  }
}
