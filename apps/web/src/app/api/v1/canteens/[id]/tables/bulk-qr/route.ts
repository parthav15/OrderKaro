import { NextRequest } from "next/server"
import * as QRCode from "qrcode"
import prisma from "@/lib/prisma"
import {
  success,
  handleError,
  requireRole,
  AuthError,
} from "@/lib/api-utils"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    requireRole(request, "OWNER", "MANAGER")

    const canteen = await prisma.canteen.findUnique({ where: { id } })
    if (!canteen) throw new AuthError("Canteen not found", 404)

    const tables = await prisma.table.findMany({
      where: { canteenId: id, isActive: true },
      orderBy: { label: "asc" },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const qrItems = await Promise.all(
      tables.map(async (table) => {
        const url = `${appUrl}/${canteen.slug}/menu?table=${table.qrToken}`
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: 512,
          margin: 2,
          color: { dark: "#0A0A0A", light: "#FFFFFF" },
        })
        return {
          table: table.label,
          section: table.section,
          qrDataUrl,
          url,
        }
      })
    )

    return success(qrItems)
  } catch (err) {
    return handleError(err)
  }
}
