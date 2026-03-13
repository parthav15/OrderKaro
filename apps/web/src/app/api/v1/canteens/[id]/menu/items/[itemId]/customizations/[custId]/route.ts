import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
  success,
  handleError,
  requireRole,
  AuthError,
} from "@/lib/api-utils"
import { z } from "zod"

const updateCustomizationWithOptionsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(["SINGLE_SELECT", "MULTI_SELECT"]).optional(),
  isRequired: z.boolean().optional(),
  minSelect: z.number().int().min(0).optional(),
  maxSelect: z.number().int().min(1).optional(),
  options: z.array(
    z.object({
      name: z.string().min(1).max(100),
      priceAdjustment: z.number().default(0),
      isDefault: z.boolean().default(false),
      sortOrder: z.number().int().min(0).default(0),
    })
  ).optional(),
})

async function resolveCustomization(canteenId: string, itemId: string, custId: string) {
  const customization = await prisma.customization.findFirst({
    where: {
      id: custId,
      menuItemId: itemId,
      menuItem: { category: { canteenId } },
    },
  })
  if (!customization) throw new AuthError("Customization not found", 404)
  return customization
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string; custId: string }> }
) {
  try {
    const { id, itemId, custId } = await params
    requireRole(request, "OWNER", "MANAGER")
    await resolveCustomization(id, itemId, custId)
    const body = await request.json()
    const result = updateCustomizationWithOptionsSchema.safeParse(body)
    if (!result.success) {
      const messages = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      throw new AuthError(messages, 422)
    }
    const { options, ...custData } = result.data
    if (options !== undefined) {
      await prisma.customizationOption.deleteMany({ where: { customizationId: custId } })
    }
    const customization = await prisma.customization.update({
      where: { id: custId },
      data: {
        ...custData,
        ...(options !== undefined && {
          options: { create: options },
        }),
      },
      include: { options: { orderBy: { sortOrder: "asc" } } },
    })
    return success(customization)
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string; custId: string }> }
) {
  try {
    const { id, itemId, custId } = await params
    requireRole(request, "OWNER", "MANAGER")
    await resolveCustomization(id, itemId, custId)
    await prisma.customization.delete({ where: { id: custId } })
    return success({ message: "Customization deleted" })
  } catch (err) {
    return handleError(err)
  }
}
