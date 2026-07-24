import { NextRequest } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { success, handleError, requireRole, parseBody, AuthError } from "@/lib/api-utils"
import { encryptSecret } from "@/lib/secure-store"
import { createCashfreeVendor } from "@/lib/payments/cashfree-vendor"

const onboardingSchema = z
  .object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    phone: z.string().min(8).max(20),
    pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Enter a valid PAN"),
    payoutMethod: z.enum(["BANK", "UPI"]),
    bankAccount: z.string().min(6).max(30).optional(),
    ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid IFSC").optional(),
    upi: z.string().regex(/^[\w.-]{2,}@[a-zA-Z]{2,}$/, "Enter a valid UPI ID").optional(),
  })
  .refine((d) => (d.payoutMethod === "UPI" ? Boolean(d.upi) : Boolean(d.bankAccount && d.ifsc)), {
    message: "Provide a bank account + IFSC, or a UPI ID",
  })

async function ownedRestaurant(request: NextRequest, id: string) {
  const user = requireRole(request, "OWNER")
  const restaurant = await prisma.restaurant.findFirst({ where: { id, ownerId: user.id } })
  if (!restaurant) throw new AuthError("Restaurant not found", 404)
  return restaurant
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await ownedRestaurant(request, id)
    const account = await prisma.restaurantPaymentAccount.findUnique({ where: { restaurantId: id } })
    return success({
      collectionMode: account?.collectionMode ?? "BYO",
      vendorKycStatus: account?.vendorKycStatus ?? "PENDING",
      onboarded: account?.collectionMode === "MARKETPLACE" && Boolean(account?.cashfreeVendorId),
      payoutName: account?.payoutName ?? null,
      payoutEmail: account?.payoutEmail ?? null,
      payoutPhone: account?.payoutPhone ?? null,
      payoutUpi: account?.payoutUpi ?? null,
      payoutIfsc: account?.payoutIfsc ?? null,
      hasBankAccount: Boolean(account?.payoutBankAccountCipher),
    })
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await ownedRestaurant(request, id)
    const body = await request.json()
    const data = parseBody(onboardingSchema, body)

    const vendorId = `vm_${id.replace(/-/g, "").slice(0, 28)}`
    const vendor = await createCashfreeVendor({
      vendorId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      pan: data.pan.toUpperCase(),
      method: data.payoutMethod,
      bankAccount: data.bankAccount,
      ifsc: data.ifsc?.toUpperCase(),
      upi: data.upi,
    })

    const fields = {
      provider: "CASHFREE" as const,
      status: "ACTIVE" as const,
      collectionMode: "MARKETPLACE" as const,
      cashfreeVendorId: vendor.vendorId,
      vendorKycStatus: vendor.kycStatus,
      payoutName: data.name,
      payoutEmail: data.email,
      payoutPhone: data.phone,
      payoutPanCipher: encryptSecret(data.pan.toUpperCase()),
      payoutBankAccountCipher: data.bankAccount ? encryptSecret(data.bankAccount) : null,
      payoutIfsc: data.ifsc ? data.ifsc.toUpperCase() : null,
      payoutUpi: data.upi ?? null,
    }

    const account = await prisma.restaurantPaymentAccount.upsert({
      where: { restaurantId: id },
      create: { restaurantId: id, ...fields },
      update: fields,
    })

    return success({
      collectionMode: account.collectionMode,
      vendorKycStatus: account.vendorKycStatus,
      onboarded: true,
      payoutName: account.payoutName,
      payoutUpi: account.payoutUpi,
      payoutIfsc: account.payoutIfsc,
    })
  } catch (err) {
    return handleError(err)
  }
}
