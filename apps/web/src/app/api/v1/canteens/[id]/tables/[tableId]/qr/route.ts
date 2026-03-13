import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
  success,
  handleError,
  requireRole,
  AuthError,
} from "@/lib/api-utils"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tableId: string }> }
) {
  try {
    const { id, tableId } = await params
    requireRole(request, "OWNER", "MANAGER")
    const table = await prisma.table.findFirst({
      where: { id: tableId, canteenId: id },
      include: { canteen: { select: { slug: true } } },
    })
    if (!table) throw new AuthError("Table not found", 404)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const qrUrl = `${appUrl}/${table.canteen.slug}/menu?table=${table.qrToken}`
    return success({
      qrUrl,
      tableLabel: table.label,
      qrToken: table.qrToken,
    })
  } catch (err) {
    return handleError(err)
  }
}
