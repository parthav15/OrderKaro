import { Router } from "express"
import { validate } from "../../middleware/validate"
import {
  ownerRegisterSchema,
  ownerLoginSchema,
  staffLoginSchema,
  staffPinLoginSchema,
  refreshTokenSchema,
  consumerRegisterSchema,
  consumerLoginSchema,
} from "@orderkaro/shared"
import * as controller from "./auth.controller"

const router: ReturnType<typeof Router> = Router()

router.post("/owner/register", validate(ownerRegisterSchema), controller.ownerRegister)
router.post("/owner/login", validate(ownerLoginSchema), controller.ownerLogin)
router.post("/staff/login", validate(staffLoginSchema), controller.staffLogin)
router.post("/staff/pin-login", validate(staffPinLoginSchema), controller.staffPinLogin)
router.post("/consumer/register", validate(consumerRegisterSchema), controller.consumerRegister)
router.post("/consumer/login", validate(consumerLoginSchema), controller.consumerLogin)
router.post("/refresh", validate(refreshTokenSchema), controller.refreshToken)

export default router
