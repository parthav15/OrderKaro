import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
  success,
  handleError,
  requireRole,
  AuthError,
} from "@/lib/api-utils"
import { z } from "zod"

const updateTableSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  section: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
})

async function resolveTable(canteenId: string, tableId: string) {
  const table = await prisma.table.findFirst({
    where: { id: tableId, canteenId },
  })
  if (!table) throw new AuthError("Table not found", 404)
  return table
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tableId: string }> }
) {
  try {
    const { id, tableId } = await params
    requireRole(request, "OWNER", "MANAGER")
    await resolveTable(id, tableId)
    const body = await request.json()
    const result = updateTableSchema.safeParse(body)
    if (!result.success) {
      const messages = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      throw new AuthError(messages, 422)
    }
    const table = await prisma.table.update({
      where: { id: tableId },
      data: result.data,
    })
    return success(table)
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tableId: string }> }
) {
  try {
    const { id, tableId } = await params
    requireRole(request, "OWNER", "MANAGER")
    await resolveTable(id, tableId)
    await prisma.table.delete({ where: { id: tableId } })
    return success({ message: "Table deleted" })
  } catch (err) {
    return handleError(err)
  }
}
