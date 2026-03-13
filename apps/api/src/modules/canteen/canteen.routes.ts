import { Router } from "express"
import { authenticate, authorize } from "../../middleware/auth"
import { validate } from "../../middleware/validate"
import { createCanteenSchema, updateCanteenSchema } from "@orderkaro/shared"
import * as controller from "./canteen.controller"

const router: ReturnType<typeof Router> = Router()

router.use(authenticate)

router.post("/", authorize("OWNER"), validate(createCanteenSchema), controller.createCanteen)
router.get("/", authorize("OWNER"), controller.getCanteens)
router.get("/:id", authorize("OWNER"), controller.getCanteen)
router.put("/:id", authorize("OWNER"), validate(updateCanteenSchema), controller.updateCanteen)
router.delete("/:id", authorize("OWNER"), controller.deleteCanteen)

export default router
