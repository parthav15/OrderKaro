import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
  created,
  handleError,
  requireRole,
  parseBody,
  AuthError,
} from "@/lib/api-utils"
import { createMenuItemSchema } from "@orderkaro/shared"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    requireRole(request, "OWNER", "MANAGER")
    const body = await request.json()
    const data = parseBody(createMenuItemSchema, body)
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, canteenId: id },
    })
    if (!category) throw new AuthError("Category not found in this canteen", 404)
    const item = await prisma.menuItem.create({ data })
    return created(item)
  } catch (err) {
    return handleError(err)
  }
}
