import { NextRequest } from "next/server"
import * as QRCode from "qrcode"
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
    const url = `${appUrl}/${table.canteen.slug}/menu?table=${table.qrToken}`
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: { dark: "#0A0A0A", light: "#FFFFFF" },
    })
    return success({
      qrDataUrl,
      url,
      table: { label: table.label, section: table.section },
      qrToken: table.qrToken,
    })
  } catch (err) {
    return handleError(err)
  }
}
