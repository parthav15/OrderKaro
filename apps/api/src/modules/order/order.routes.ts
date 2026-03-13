import { Router } from "express"
import { authenticate, authorize } from "../../middleware/auth"
import { validate } from "../../middleware/validate"
import { placeOrderSchema, updateOrderStatusSchema, collectCashPaymentSchema } from "@orderkaro/shared"
import * as controller from "./order.controller"

const router: ReturnType<typeof Router> = Router()

router.use(authenticate)

router.post(
  "/:canteenId/orders",
  authorize("CONSUMER"),
  validate(placeOrderSchema),
  controller.placeOrder
)
router.get("/:canteenId/orders/active", authorize("KITCHEN", "COUNTER", "MANAGER", "OWNER"), controller.getActiveOrders)
router.get("/:canteenId/orders/history", authorize("OWNER", "MANAGER"), controller.getOrderHistory)
router.get("/:canteenId/orders/:orderId", controller.getOrder)
router.post("/:canteenId/orders/:orderId/cancel", authorize("CONSUMER"), controller.cancelOrder)
router.patch(
  "/:canteenId/orders/:orderId/status",
  authorize("KITCHEN", "COUNTER", "MANAGER", "OWNER"),
  validate(updateOrderStatusSchema),
  controller.updateOrderStatus
)

router.post(
  "/:canteenId/orders/:orderId/collect-cash",
  authorize("OWNER", "MANAGER", "COUNTER"),
  validate(collectCashPaymentSchema),
  controller.collectCashPayment
)

export default router
