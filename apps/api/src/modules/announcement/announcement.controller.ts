import type { Request, Response } from "express"
import prisma from "../../config/database"
import { success, error, created } from "../../utils/response"
import type { CreateAnnouncementInput, UpdateAnnouncementInput } from "@orderkaro/shared"

export async function createAnnouncement(req: Request, res: Response) {
  const data = req.body as CreateAnnouncementInput
  const canteenId = req.params.canteenId as string

  const announcement = await prisma.announcement.create({
    data: {
      canteenId,
      message: data.message,
      isActive: data.isActive ?? true,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  })

  return created(res, announcement)
}

export async function getAnnouncements(req: Request, res: Response) {
  const canteenId = req.params.canteenId as string

  const announcements = await prisma.announcement.findMany({
    where: { canteenId },
    orderBy: { createdAt: "desc" },
  })

  return success(res, announcements)
}

export async function updateAnnouncement(req: Request, res: Response) {
  const data = req.body as UpdateAnnouncementInput
  const announcementId = req.params.announcementId as string
  const canteenId = req.params.canteenId as string

  const announcement = await prisma.announcement.findFirst({
    where: { id: announcementId, canteenId },
  })
  if (!announcement) {
    return error(res, "Announcement not found", 404)
  }

  const updated = await prisma.announcement.update({
    where: { id: announcementId },
    data: {
      ...data,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    },
  })

  return success(res, updated)
}

export async function deleteAnnouncement(req: Request, res: Response) {
  const announcementId = req.params.announcementId as string
  const canteenId = req.params.canteenId as string

  const announcement = await prisma.announcement.findFirst({
    where: { id: announcementId, canteenId },
  })
  if (!announcement) {
    return error(res, "Announcement not found", 404)
  }

  await prisma.announcement.delete({ where: { id: announcementId } })
  return success(res, { message: "Announcement deleted" })
}
