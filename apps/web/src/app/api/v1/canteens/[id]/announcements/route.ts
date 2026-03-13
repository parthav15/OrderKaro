import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, created, handleError, requireRole, parseBody } from "@/lib/api-utils"
import { createAnnouncementSchema } from "@orderkaro/shared"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: canteenId } = await params
    requireRole(request, "OWNER", "MANAGER")

    const announcements = await prisma.announcement.findMany({
      where: { id: canteenId },
      orderBy: { createdAt: "desc" },
    })

    return success(announcements)
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: canteenId } = await params
    requireRole(request, "OWNER", "MANAGER")
    const body = await request.json()
    const data = parseBody(createAnnouncementSchema, body)

    const announcement = await prisma.announcement.create({
      data: {
        canteenId,
        message: data.message,
        isActive: data.isActive ?? true,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    })

    return created(announcement)
  } catch (err) {
    return handleError(err)
  }
}
