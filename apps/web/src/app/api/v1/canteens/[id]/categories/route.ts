import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
  success,
  created,
  handleError,
  requireRole,
  parseBody,
  AuthError,
} from "@/lib/api-utils"
import { createCategorySchema } from "@orderkaro/shared"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    requireRole(request, "OWNER", "MANAGER")
    const categories = await prisma.category.findMany({
      where: { canteenId: id },
      orderBy: { sortOrder: "asc" },
    })
    return success(categories)
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = requireRole(request, "OWNER", "MANAGER")
    const canteen = await prisma.canteen.findFirst({ where: { id } })
    if (!canteen) throw new AuthError("Canteen not found", 404)
    const body = await request.json()
    const data = parseBody(createCategorySchema, body)
    const category = await prisma.category.create({
      data: { ...data, canteenId: id },
    })
    return created(category)
  } catch (err) {
    return handleError(err)
  }
}
