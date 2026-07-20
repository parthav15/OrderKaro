import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError, requireRole, AuthError } from "@/lib/api-utils"
import { PLANS, PLAN_ORDER, effectivePlan, planDefinition } from "@/lib/plans"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = requireRole(request, "OWNER")
    const restaurant = await prisma.restaurant.findFirst({
      where: { id, ownerId: user.id },
    })
    if (!restaurant) throw new AuthError("Restaurant not found", 404)

    const [menuItemCount, tableCount, subscriptions] = await Promise.all([
      prisma.menuItem.count({ where: { category: { restaurantId: id } } }),
      prisma.table.count({ where: { restaurantId: id } }),
      prisma.subscription.findMany({
        where: { restaurantId: id },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
    ])

    const active = effectivePlan(restaurant)
    const definition = planDefinition(restaurant)

    return success({
      plan: active,
      storedPlan: restaurant.plan,
      planValidUntil: restaurant.planValidUntil,
      expired: restaurant.plan !== "FREE" && active === "FREE",
      definition,
      usage: {
        menuItems: menuItemCount,
        maxMenuItems: definition.maxMenuItems,
        tables: tableCount,
        maxTables: definition.maxTables,
      },
      catalogue: PLAN_ORDER.map((name) => PLANS[name]),
      subscriptions,
    })
  } catch (err) {
    return handleError(err)
  }
}
