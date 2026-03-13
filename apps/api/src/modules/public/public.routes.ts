import { Router } from "express"
import { validate } from "../../middleware/validate"
import { identifyConsumerSchema } from "@orderkaro/shared"
import * as controller from "./public.controller"

const router: ReturnType<typeof Router> = Router()

router.get("/resolve-qr/:qrToken", controller.resolveQr)
router.get("/canteen/:slug/menu", controller.getPublicMenu)
router.post("/identify", validate(identifyConsumerSchema), controller.identifyConsumer)
router.get("/track/:trackingToken", controller.trackOrder)

export default router
