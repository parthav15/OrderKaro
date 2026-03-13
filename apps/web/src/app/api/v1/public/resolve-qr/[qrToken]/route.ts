import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, error, handleError } from "@/lib/api-utils"

function isCanteenOpen(openingTime: string, closingTime: string): boolean {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const [openHour, openMin] = openingTime.split(":").map(Number)
  const [closeHour, closeMin] = closingTime.split(":").map(Number)

  const openMinutes = openHour * 60 + openMin
  const closeMinutes = closeHour * 60 + closeMin

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes
}

export async function GET(
  request: NextRequest,
  { params }: { params: { qrToken: string } }
) {
  try {
    const table = await prisma.table.findUnique({
      where: { qrToken: params.qrToken },
      include: {
        canteen: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            description: true,
            phone: true,
            isActive: true,
            openingTime: true,
            closingTime: true,
            avgPrepTime: true,
          },
        },
      },
    })

    if (!table) {
      return error("QR code not found", 404)
    }

    if (!table.isActive) {
      return error("This table is not active", 400)
    }

    if (!table.canteen.isActive) {
      return error("This canteen is not active", 400)
    }

    const isOpen = isCanteenOpen(table.canteen.openingTime, table.canteen.closingTime)

    const announcements = await prisma.announcement.findMany({
      where: {
        canteenId: table.canteenId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      select: { id: true, message: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    })

    return success({
      canteen: table.canteen,
      table: { id: table.id, label: table.label, section: table.section },
      isOpen,
      announcements,
    })
  } catch (err) {
    return handleError(err)
  }
}
