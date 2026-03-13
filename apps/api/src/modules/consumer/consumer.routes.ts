import { Router } from "express"
import { authenticate, authorize } from "../../middleware/auth"
import { getConsumerOrders } from "../order/order.controller"

const router: ReturnType<typeof Router> = Router()

router.use(authenticate)
router.use(authorize("CONSUMER"))

router.get("/orders", getConsumerOrders)

export default router
