import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
  success,
  handleError,
  requireRole,
  parseBody,
  AuthError,
} from "@/lib/api-utils"
import { updateCategorySchema } from "@orderkaro/shared"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; catId: string }> }
) {
  try {
    const { id, catId } = await params
    requireRole(request, "OWNER", "MANAGER")
    const existing = await prisma.category.findFirst({
      where: { id: catId, canteenId: id },
    })
    if (!existing) throw new AuthError("Category not found", 404)
    const body = await request.json()
    const data = parseBody(updateCategorySchema, body)
    const category = await prisma.category.update({
      where: { id: catId },
      data,
    })
    return success(category)
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; catId: string }> }
) {
  try {
    const { id, catId } = await params
    requireRole(request, "OWNER", "MANAGER")
    const existing = await prisma.category.findFirst({
      where: { id: catId, canteenId: id },
    })
    if (!existing) throw new AuthError("Category not found", 404)
    await prisma.category.delete({ where: { id: catId } })
    return success({ message: "Category deleted" })
  } catch (err) {
    return handleError(err)
  }
}
