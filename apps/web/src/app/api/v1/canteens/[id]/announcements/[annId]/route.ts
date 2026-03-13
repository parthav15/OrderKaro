import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError, requireRole, parseBody, AuthError } from "@/lib/api-utils"
import { updateAnnouncementSchema } from "@orderkaro/shared"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; annId: string }> }
) {
  try {
    const { id: canteenId, annId } = await params
    requireRole(request, "OWNER", "MANAGER")

    const announcement = await prisma.announcement.findFirst({
      where: { id: annId, canteenId },
    })
    if (!announcement) throw new AuthError("Announcement not found", 404)

    const body = await request.json()
    const data = parseBody(updateAnnouncementSchema, body)

    const updated = await prisma.announcement.update({
      where: { id: annId },
      data: {
        ...(data.message !== undefined ? { message: data.message } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.expiresAt !== undefined ? { expiresAt: new Date(data.expiresAt) } : {}),
      },
    })

    return success(updated)
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; annId: string }> }
) {
  try {
    const { id: canteenId, annId } = await params
    requireRole(request, "OWNER", "MANAGER")

    const announcement = await prisma.announcement.findFirst({
      where: { id: annId, canteenId },
    })
    if (!announcement) throw new AuthError("Announcement not found", 404)

    await prisma.announcement.delete({ where: { id: annId } })

    return success({ message: "Announcement deleted" })
  } catch (err) {
    return handleError(err)
  }
}
