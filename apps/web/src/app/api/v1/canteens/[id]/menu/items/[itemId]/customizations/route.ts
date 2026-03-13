import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
  success,
  created,
  handleError,
  requireRole,
  AuthError,
} from "@/lib/api-utils"
import { z } from "zod"

const customizationWithOptionsSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["SINGLE_SELECT", "MULTI_SELECT"]),
  isRequired: z.boolean().default(false),
  minSelect: z.number().int().min(0).default(0),
  maxSelect: z.number().int().min(1).default(1),
  options: z.array(
    z.object({
      name: z.string().min(1).max(100),
      priceAdjustment: z.number().default(0),
      isDefault: z.boolean().default(false),
      sortOrder: z.number().int().min(0).default(0),
    })
  ).default([]),
})

async function resolveItem(canteenId: string, itemId: string) {
  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, category: { canteenId } },
  })
  if (!item) throw new AuthError("Menu item not found", 404)
  return item
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params
    await resolveItem(id, itemId)
    const customizations = await prisma.customization.findMany({
      where: { menuItemId: itemId },
      include: { options: { orderBy: { sortOrder: "asc" } } },
    })
    return success(customizations)
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params
    requireRole(request, "OWNER", "MANAGER")
    await resolveItem(id, itemId)
    const body = await request.json()
    const result = customizationWithOptionsSchema.safeParse(body)
    if (!result.success) {
      const messages = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      throw new AuthError(messages, 422)
    }
    const { options, ...custData } = result.data
    const customization = await prisma.customization.create({
      data: {
        ...custData,
        menuItemId: itemId,
        options: { create: options },
      },
      include: { options: { orderBy: { sortOrder: "asc" } } },
    })
    return created(customization)
  } catch (err) {
    return handleError(err)
  }
}
