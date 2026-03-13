import type { Request, Response } from "express"
import prisma from "../../config/database"
import { success, error, created } from "../../utils/response"
import type {
  CreateCategoryInput,
  CreateMenuItemInput,
  UpdateMenuItemInput,
  CreateCustomizationInput,
  UpdateCustomizationInput,
  CreateCustomizationOptionInput,
  UpdateCustomizationOptionInput,
} from "@orderkaro/shared"

export async function getFullMenu(req: Request, res: Response) {
  const canteenId = req.params.canteenId as string

  const canteen = await prisma.canteen.findUnique({
    where: { id: canteenId },
    select: { id: true, name: true, slug: true, logoUrl: true, isActive: true },
  })
  if (!canteen) {
    return error(res, "Canteen not found", 404)
  }

  const categories = await prisma.category.findMany({
    where: { canteenId, isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        where: { category: { isActive: true } },
        orderBy: { sortOrder: "asc" },
        include: {
          customizations: {
            include: { options: { orderBy: { sortOrder: "asc" } } },
          },
        },
      },
    },
  })

  return success(res, { canteen, categories })
}

export async function getCategories(req: Request, res: Response) {
  const categories = await prisma.category.findMany({
    where: { canteenId: req.params.canteenId as string },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { items: true } } },
  })
  return success(res, categories)
}

export async function createCategory(req: Request, res: Response) {
  const data = req.body as CreateCategoryInput
  const category = await prisma.category.create({
    data: { ...data, canteenId: req.params.canteenId as string },
  })
  return created(res, category)
}

export async function updateCategory(req: Request, res: Response) {
  const category = await prisma.category.findFirst({
    where: { id: req.params.catId as string, canteenId: req.params.canteenId as string },
  })
  if (!category) {
    return error(res, "Category not found", 404)
  }

  const updated = await prisma.category.update({
    where: { id: req.params.catId as string },
    data: req.body,
  })
  return success(res, updated)
}

export async function deleteCategory(req: Request, res: Response) {
  const category = await prisma.category.findFirst({
    where: { id: req.params.catId as string, canteenId: req.params.canteenId as string },
  })
  if (!category) {
    return error(res, "Category not found", 404)
  }

  await prisma.category.delete({ where: { id: req.params.catId as string } })
  return success(res, { message: "Category deleted" })
}

export async function createMenuItem(req: Request, res: Response) {
  const data = req.body as CreateMenuItemInput

  const category = await prisma.category.findFirst({
    where: { id: data.categoryId, canteenId: req.params.canteenId as string },
  })
  if (!category) {
    return error(res, "Category not found", 404)
  }

  const item = await prisma.menuItem.create({
    data,
  })
  return created(res, item)
}

export async function updateMenuItem(req: Request, res: Response) {
  const data = req.body as UpdateMenuItemInput

  const item = await prisma.menuItem.findFirst({
    where: {
      id: req.params.itemId as string,
      category: { canteenId: req.params.canteenId as string },
    },
  })
  if (!item) {
    return error(res, "Menu item not found", 404)
  }

  const updated = await prisma.menuItem.update({
    where: { id: req.params.itemId as string },
    data,
  })
  return success(res, updated)
}

export async function deleteMenuItem(req: Request, res: Response) {
  const item = await prisma.menuItem.findFirst({
    where: {
      id: req.params.itemId as string,
      category: { canteenId: req.params.canteenId as string },
    },
  })
  if (!item) {
    return error(res, "Menu item not found", 404)
  }

  await prisma.menuItem.delete({ where: { id: req.params.itemId as string } })
  return success(res, { message: "Menu item deleted" })
}

export async function toggleAvailability(req: Request, res: Response) {
  const item = await prisma.menuItem.findFirst({
    where: {
      id: req.params.itemId as string,
      category: { canteenId: req.params.canteenId as string },
    },
  })
  if (!item) {
    return error(res, "Menu item not found", 404)
  }

  const updated = await prisma.menuItem.update({
    where: { id: req.params.itemId as string },
    data: { isAvailable: !item.isAvailable },
  })
  return success(res, updated)
}

async function resolveMenuItemForCanteen(
  itemId: string,
  canteenId: string
): Promise<boolean> {
  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, category: { canteenId } },
    select: { id: true },
  })
  return item !== null
}

export async function createCustomization(req: Request, res: Response) {
  const data = req.body as CreateCustomizationInput
  const itemId = req.params.itemId as string
  const canteenId = req.params.canteenId as string

  const itemExists = await resolveMenuItemForCanteen(itemId, canteenId)
  if (!itemExists) {
    return error(res, "Menu item not found", 404)
  }

  const customization = await prisma.customization.create({
    data: {
      menuItemId: itemId,
      name: data.name,
      type: data.type,
      isRequired: data.isRequired,
      minSelect: data.minSelect,
      maxSelect: data.maxSelect,
    },
    include: { options: { orderBy: { sortOrder: "asc" } } },
  })
  return created(res, customization)
}

export async function updateCustomization(req: Request, res: Response) {
  const data = req.body as UpdateCustomizationInput
  const itemId = req.params.itemId as string
  const canteenId = req.params.canteenId as string
  const custId = req.params.custId as string

  const itemExists = await resolveMenuItemForCanteen(itemId, canteenId)
  if (!itemExists) {
    return error(res, "Menu item not found", 404)
  }

  const customization = await prisma.customization.findFirst({
    where: { id: custId, menuItemId: itemId },
  })
  if (!customization) {
    return error(res, "Customization not found", 404)
  }

  const updated = await prisma.customization.update({
    where: { id: custId },
    data,
    include: { options: { orderBy: { sortOrder: "asc" } } },
  })
  return success(res, updated)
}

export async function deleteCustomization(req: Request, res: Response) {
  const itemId = req.params.itemId as string
  const canteenId = req.params.canteenId as string
  const custId = req.params.custId as string

  const itemExists = await resolveMenuItemForCanteen(itemId, canteenId)
  if (!itemExists) {
    return error(res, "Menu item not found", 404)
  }

  const customization = await prisma.customization.findFirst({
    where: { id: custId, menuItemId: itemId },
  })
  if (!customization) {
    return error(res, "Customization not found", 404)
  }

  await prisma.customization.delete({ where: { id: custId } })
  return success(res, { message: "Customization deleted" })
}

export async function addCustomizationOption(req: Request, res: Response) {
  const data = req.body as CreateCustomizationOptionInput
  const itemId = req.params.itemId as string
  const canteenId = req.params.canteenId as string
  const custId = req.params.custId as string

  const itemExists = await resolveMenuItemForCanteen(itemId, canteenId)
  if (!itemExists) {
    return error(res, "Menu item not found", 404)
  }

  const customization = await prisma.customization.findFirst({
    where: { id: custId, menuItemId: itemId },
  })
  if (!customization) {
    return error(res, "Customization not found", 404)
  }

  const option = await prisma.customizationOption.create({
    data: {
      customizationId: custId,
      name: data.name,
      priceAdjustment: data.priceAdjustment,
      isDefault: data.isDefault,
      sortOrder: data.sortOrder,
    },
  })
  return created(res, option)
}

export async function updateCustomizationOption(req: Request, res: Response) {
  const data = req.body as UpdateCustomizationOptionInput
  const itemId = req.params.itemId as string
  const canteenId = req.params.canteenId as string
  const custId = req.params.custId as string
  const optId = req.params.optId as string

  const itemExists = await resolveMenuItemForCanteen(itemId, canteenId)
  if (!itemExists) {
    return error(res, "Menu item not found", 404)
  }

  const option = await prisma.customizationOption.findFirst({
    where: { id: optId, customizationId: custId, customization: { menuItemId: itemId } },
  })
  if (!option) {
    return error(res, "Option not found", 404)
  }

  const updated = await prisma.customizationOption.update({
    where: { id: optId },
    data,
  })
  return success(res, updated)
}

export async function deleteCustomizationOption(req: Request, res: Response) {
  const itemId = req.params.itemId as string
  const canteenId = req.params.canteenId as string
  const custId = req.params.custId as string
  const optId = req.params.optId as string

  const itemExists = await resolveMenuItemForCanteen(itemId, canteenId)
  if (!itemExists) {
    return error(res, "Menu item not found", 404)
  }

  const option = await prisma.customizationOption.findFirst({
    where: { id: optId, customizationId: custId, customization: { menuItemId: itemId } },
  })
  if (!option) {
    return error(res, "Option not found", 404)
  }

  await prisma.customizationOption.delete({ where: { id: optId } })
  return success(res, { message: "Option deleted" })
}
