import { AuthError } from "@/lib/api-utils"

export type PlanName = "FREE" | "BASIC" | "PRO"

export type PlanFeature =
  | "branding"
  | "delivery"
  | "viewAnalytics"
  | "ar"

export interface PlanDefinition {
  name: PlanName
  label: string
  monthlyPrice: number
  maxMenuItems: number
  maxTables: number
  features: Record<PlanFeature, boolean>
}

export const PLANS: Record<PlanName, PlanDefinition> = {
  FREE: {
    name: "FREE",
    label: "Free",
    monthlyPrice: 0,
    maxMenuItems: 25,
    maxTables: 5,
    features: { branding: false, delivery: false, viewAnalytics: false, ar: false },
  },
  BASIC: {
    name: "BASIC",
    label: "Basic",
    monthlyPrice: 499,
    maxMenuItems: 150,
    maxTables: 30,
    features: { branding: true, delivery: true, viewAnalytics: true, ar: false },
  },
  PRO: {
    name: "PRO",
    label: "Pro",
    monthlyPrice: 1499,
    maxMenuItems: 1000,
    maxTables: 200,
    features: { branding: true, delivery: true, viewAnalytics: true, ar: true },
  },
}

export const PLAN_ORDER: PlanName[] = ["FREE", "BASIC", "PRO"]

export const SUBSCRIPTION_DAYS = 30

interface PlanBearing {
  plan: string
  planValidUntil: Date | null
}

export function effectivePlan(restaurant: PlanBearing, now = new Date()): PlanName {
  const stored = restaurant.plan as PlanName
  if (stored === "FREE") return "FREE"
  if (!restaurant.planValidUntil) return "FREE"
  return restaurant.planValidUntil.getTime() > now.getTime() ? stored : "FREE"
}

export function planDefinition(restaurant: PlanBearing, now = new Date()): PlanDefinition {
  return PLANS[effectivePlan(restaurant, now)]
}

export function hasFeature(
  restaurant: PlanBearing,
  feature: PlanFeature,
  now = new Date()
): boolean {
  return planDefinition(restaurant, now).features[feature]
}

export function requireFeature(
  restaurant: PlanBearing,
  feature: PlanFeature,
  now = new Date()
): void {
  if (hasFeature(restaurant, feature, now)) return
  const needed = PLAN_ORDER.find((p) => PLANS[p].features[feature])
  throw new AuthError(
    `Your ${planDefinition(restaurant, now).label} plan does not include this feature. Upgrade to ${
      needed ? PLANS[needed].label : "a paid plan"
    } to unlock it.`,
    402
  )
}

export function requireWithinLimit(
  restaurant: PlanBearing,
  limit: "maxMenuItems" | "maxTables",
  currentCount: number,
  now = new Date()
): void {
  const definition = planDefinition(restaurant, now)
  if (currentCount < definition[limit]) return
  throw new AuthError(
    `Your ${definition.label} plan allows up to ${definition[limit]} ${
      limit === "maxMenuItems" ? "menu items" : "tables"
    }. Upgrade your plan to add more.`,
    402
  )
}
