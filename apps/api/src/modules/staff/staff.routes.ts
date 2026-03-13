import { Router } from "express"
import { authenticate, authorize } from "../../middleware/auth"
import { validate } from "../../middleware/validate"
import { createStaffSchema, updateStaffSchema } from "@orderkaro/shared"
import * as controller from "./staff.controller"

const router: ReturnType<typeof Router> = Router()

const auth = [authenticate, authorize("OWNER", "MANAGER")]

router.post("/:canteenId/staff", ...auth, validate(createStaffSchema), controller.createStaff)
router.get("/:canteenId/staff", ...auth, controller.getStaff)
router.put("/:canteenId/staff/:staffId", ...auth, validate(updateStaffSchema), controller.updateStaff)
router.delete("/:canteenId/staff/:staffId", ...auth, controller.deleteStaff)
router.patch("/:canteenId/staff/:staffId/toggle", ...auth, controller.toggleStaff)

export default router
