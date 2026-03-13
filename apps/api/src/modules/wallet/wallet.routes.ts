import { Router } from "express"
import { authenticate, authorize } from "../../middleware/auth"
import { validate } from "../../middleware/validate"
import {
  rechargeRequestSchema,
  creditWalletSchema,
  approveRechargeSchema,
} from "@orderkaro/shared"
import * as controller from "./wallet.controller"

const router: ReturnType<typeof Router> = Router()

router.use(authenticate)

router.get("/consumer/wallet", authorize("CONSUMER"), controller.getWallet)
router.get("/consumer/wallet/transactions", authorize("CONSUMER"), controller.getTransactions)
router.post(
  "/consumer/wallet/recharge-request",
  authorize("CONSUMER"),
  validate(rechargeRequestSchema),
  controller.submitRechargeRequest
)

router.get(
  "/canteens/:canteenId/wallet/requests",
  authorize("OWNER", "MANAGER"),
  controller.getPendingRequests
)
router.patch(
  "/canteens/:canteenId/wallet/requests/:reqId",
  authorize("OWNER", "MANAGER"),
  validate(approveRechargeSchema),
  controller.handleRechargeRequest
)
router.post(
  "/canteens/:canteenId/wallet/credit",
  authorize("OWNER", "MANAGER", "COUNTER"),
  validate(creditWalletSchema),
  controller.creditWallet
)
router.get(
  "/canteens/:canteenId/consumers",
  authorize("OWNER", "MANAGER"),
  controller.getConsumers
)

export default router
