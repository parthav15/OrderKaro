import { Router } from "express"
import { authenticate, authorize } from "../../middleware/auth"
import { validate } from "../../middleware/validate"
import {
  createTableSchema,
  updateTableSchema,
  bulkUpdatePositionsSchema,
} from "@orderkaro/shared"
import * as controller from "./table.controller"

const router: ReturnType<typeof Router> = Router()

const auth = [authenticate, authorize("OWNER", "MANAGER")]

router.post("/:canteenId/tables", ...auth, validate(createTableSchema), controller.createTable)
router.get("/:canteenId/tables", ...auth, controller.getTables)
router.put("/:canteenId/tables/:tableId", ...auth, validate(updateTableSchema), controller.updateTable)
router.delete("/:canteenId/tables/:tableId", ...auth, controller.deleteTable)
router.get("/:canteenId/tables/:tableId/qr", ...auth, controller.getQrCode)
router.post("/:canteenId/tables/bulk-qr", ...auth, controller.bulkQrCodes)
router.patch(
  "/:canteenId/tables/positions",
  ...auth,
  validate(bulkUpdatePositionsSchema),
  controller.bulkUpdatePositions
)

export default router
