import { Router } from "express"
import type { Request, Response, NextFunction } from "express"
import { authenticate } from "../../middleware/auth"
import { error } from "../../utils/response"
import prisma from "../../config/database"
import { listOwners, toggleOwnerVerification, getSystemStats } from "./admin.controller"

const router: ReturnType<typeof Router> = Router()

async function superAdminOnly(req: Request, res: Response, next: NextFunction) {
  const superAdminEmail =
    process.env.SUPER_ADMIN_EMAIL || "admin@orderkaro.com"

  if (!req.user) {
    return error(res, "Not authenticated", 401)
  }

  if (req.user.role !== "OWNER") {
    return error(res, "Super admin access required", 403)
  }

  const owner = await prisma.owner.findUnique({
    where: { id: req.user.id },
    select: { email: true },
  })

  if (!owner || owner.email !== superAdminEmail) {
    return error(res, "Super admin access required", 403)
  }

  next()
}

router.use(authenticate)
router.use(superAdminOnly)

router.get("/owners", listOwners)
router.patch("/owners/:id/verify", toggleOwnerVerification)
router.get("/stats", getSystemStats)

export default router
