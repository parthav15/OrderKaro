import { Router } from "express"
import { authenticate, authorize } from "../../middleware/auth"
import { validate } from "../../middleware/validate"
import {
  createCategorySchema,
  updateCategorySchema,
  createMenuItemSchema,
  updateMenuItemSchema,
  createCustomizationSchema,
  updateCustomizationSchema,
  createCustomizationOptionSchema,
  updateCustomizationOptionSchema,
} from "@orderkaro/shared"
import * as controller from "./menu.controller"

const router: ReturnType<typeof Router> = Router()

const auth = [authenticate, authorize("OWNER", "MANAGER")]

router.get("/:canteenId/menu", controller.getFullMenu)
router.post("/:canteenId/categories", ...auth, validate(createCategorySchema), controller.createCategory)
router.get("/:canteenId/categories", ...auth, controller.getCategories)
router.put("/:canteenId/categories/:catId", ...auth, validate(updateCategorySchema), controller.updateCategory)
router.delete("/:canteenId/categories/:catId", ...auth, controller.deleteCategory)
router.post("/:canteenId/menu/items", ...auth, validate(createMenuItemSchema), controller.createMenuItem)
router.put("/:canteenId/menu/items/:itemId", ...auth, validate(updateMenuItemSchema), controller.updateMenuItem)
router.delete("/:canteenId/menu/items/:itemId", ...auth, controller.deleteMenuItem)
router.patch("/:canteenId/menu/items/:itemId/availability", ...auth, controller.toggleAvailability)

router.post("/:canteenId/menu/items/:itemId/customizations", ...auth, validate(createCustomizationSchema), controller.createCustomization)
router.put("/:canteenId/menu/items/:itemId/customizations/:custId", ...auth, validate(updateCustomizationSchema), controller.updateCustomization)
router.delete("/:canteenId/menu/items/:itemId/customizations/:custId", ...auth, controller.deleteCustomization)
router.post("/:canteenId/menu/items/:itemId/customizations/:custId/options", ...auth, validate(createCustomizationOptionSchema), controller.addCustomizationOption)
router.put("/:canteenId/menu/items/:itemId/customizations/:custId/options/:optId", ...auth, validate(updateCustomizationOptionSchema), controller.updateCustomizationOption)
router.delete("/:canteenId/menu/items/:itemId/customizations/:custId/options/:optId", ...auth, controller.deleteCustomizationOption)

export default router
