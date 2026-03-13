import { Router } from "express"
import { authenticate, authorize } from "../../middleware/auth"
import * as controller from "./analytics.controller"

const router: ReturnType<typeof Router> = Router()

const auth = [authenticate, authorize("OWNER", "MANAGER")]

router.get("/:canteenId/analytics/summary", ...auth, controller.getSummary)
router.get("/:canteenId/analytics/revenue", ...auth, controller.getRevenue)
router.get("/:canteenId/analytics/popular-items", ...auth, controller.getPopularItems)
router.get("/:canteenId/analytics/peak-hours", ...auth, controller.getPeakHours)
router.get("/:canteenId/analytics/category-revenue", ...auth, controller.getCategoryRevenue)

export default router
