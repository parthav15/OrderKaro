import { NextRequest } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { success, handleError, requireRole, parseBody, AuthError } from "@/lib/api-utils"
import { getPlatformConfig } from "@/lib/platform-fees"

async function requireSuperAdmin(request: NextRequest) {
  const user = requireRole(request, "OWNER")
  const owner = await prisma.owner.findUnique({ where: { id: user.id } })
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@orderkaro.com"
  if (!owner || owner.email !== superAdminEmail) {
    throw new AuthError("Super admin access required", 403)
  }
}

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
