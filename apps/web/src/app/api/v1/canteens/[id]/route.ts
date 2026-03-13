import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
  success,
  error,
  handleError,
  requireRole,
  parseBody,
  AuthError,
} from "@/lib/api-utils"
import { updateCanteenSchema } from "@orderkaro/shared"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = requireRole(request, "OWNER")
    const canteen = await prisma.canteen.findFirst({
      where: { id, ownerId: user.id },
      include: {
        categories: { orderBy: { sortOrder: "asc" } },
        tables: { orderBy: { label: "asc" } },
        _count: { select: { staff: true } },
      },
    })
    if (!canteen) return error("Canteen not found", 404)
    return success(canteen)
  } catch (err) {
    return handleError(err)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = requireRole(request, "OWNER")
    const existing = await prisma.canteen.findFirst({
      where: { id, ownerId: user.id },
    })
    if (!existing) throw new AuthError("Canteen not found", 404)
    const body = await request.json()
    const data = parseBody(updateCanteenSchema, body)
    const canteen = await prisma.canteen.update({ where: { id }, data })
    return success(canteen)
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = requireRole(request, "OWNER")
    const existing = await prisma.canteen.findFirst({
      where: { id, ownerId: user.id },
    })
    if (!existing) throw new AuthError("Canteen not found", 404)
    await prisma.canteen.delete({ where: { id } })
    return success({ message: "Canteen deleted" })
  } catch (err) {
    return handleError(err)
  }
}
