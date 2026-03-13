import { Router } from "express"
import { authenticate, authorize } from "../../middleware/auth"
import { validate } from "../../middleware/validate"
import { createAnnouncementSchema, updateAnnouncementSchema } from "@orderkaro/shared"
import * as controller from "./announcement.controller"

const router: ReturnType<typeof Router> = Router()

const auth = [authenticate, authorize("OWNER", "MANAGER")]

router.post("/:canteenId/announcements", ...auth, validate(createAnnouncementSchema), controller.createAnnouncement)
router.get("/:canteenId/announcements", ...auth, controller.getAnnouncements)
router.put("/:canteenId/announcements/:announcementId", ...auth, validate(updateAnnouncementSchema), controller.updateAnnouncement)
router.delete("/:canteenId/announcements/:announcementId", ...auth, controller.deleteAnnouncement)

export default router
