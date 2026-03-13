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
import { createTableSchema } from "@orderkaro/shared"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    requireRole(request, "OWNER", "MANAGER")
    const tables = await prisma.table.findMany({
      where: { canteenId: id },
      orderBy: { label: "asc" },
    })
    return success(tables)
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
    requireRole(request, "OWNER", "MANAGER")
    const canteen = await prisma.canteen.findUnique({ where: { id } })
    if (!canteen) throw new AuthError("Canteen not found", 404)
    const body = await request.json()
    const data = parseBody(createTableSchema, body)
    const table = await prisma.table.create({
      data: { ...data, canteenId: id },
    })
    return created(table)
  } catch (err) {
    return handleError(err)
  }
}
