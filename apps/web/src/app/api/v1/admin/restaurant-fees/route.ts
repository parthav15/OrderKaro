import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError, requireRole, AuthError } from "@/lib/api-utils"

async function requireSuperAdmin(request: NextRequest) {
  const user = requireRole(request, "OWNER")
  const owner = await prisma.owner.findUnique({ where: { id: user.id } })
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@orderkaro.com"
  if (!owner || owner.email !== superAdminEmail) {
    throw new AuthError("Super admin access required", 403)
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request)
    const restaurants = await prisma.restaurant.findMany({
      select: {
        id: true,
        name: true,
        country: true,
        paymentAccount: { select: { collectionMode: true } },
        feeConfig: true,
      },
      orderBy: { name: "asc" },
    })
    const rows = restaurants.map((r) => ({
      id: r.id,
      name: r.name,
      country: r.country,
      collectionMode: r.paymentAccount?.collectionMode ?? "BYO",
      deliveryFeeEnabled: r.feeConfig?.deliveryFeeEnabled ?? false,
      deliveryFeeMode: r.feeConfig?.deliveryFeeMode ?? "FLAT",
      deliveryFeeAmount: Number((r.feeConfig?.deliveryFeeAmount ?? 0).toString()),
      deliveryFeeBeneficiary: r.feeConfig?.deliveryFeeBeneficiary ?? "RESTAURANT",
      convenienceFeeEnabled: r.feeConfig?.convenienceFeeEnabled ?? false,
      convenienceFeeMode: r.feeConfig?.convenienceFeeMode ?? "FLAT",
      convenienceFeeAmount: Number((r.feeConfig?.convenienceFeeAmount ?? 0).toString()),
      convenienceFeeBeneficiary: r.feeConfig?.convenienceFeeBeneficiary ?? "RESTAURANT",
    }))
    return success({ restaurants: rows })
  } catch (err) {
    return handleError(err)
  }
}
