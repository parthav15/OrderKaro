import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, error, handleError } from "@/lib/api-utils"
import { hasFeature } from "@/lib/plans"
import { gatewayForRestaurant, currencyForCountry } from "@/lib/payments"
import { DEFAULT_BRAND_COLOR } from "@/lib/brand-color"

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: params.slug },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        description: true,
        phone: true,
        isActive: true,
        openingTime: true,
        closingTime: true,
        avgPrepTime: true,
        primaryColor: true,
        themeMode: true,
        deliveryEnabled: true,
        deliveryRadiusKm: true,
        deliveryFee: true,
        minOrderValue: true,
        acceptsCash: true,
        acceptsOnline: true,
        acceptsDineIn: true,
        acceptsTakeaway: true,
        acceptsDelivery: true,
        latitude: true,
        longitude: true,
        plan: true,
        planValidUntil: true,
        country: true,
      },
    })

    if (!restaurant) {
      return error("Restaurant not found", 404)
    }

    if (!restaurant.isActive) {
      return error("Restaurant is not active", 400)
    }

    const categories = await prisma.category.findMany({
      where: {
        restaurantId: restaurant.id,
        isActive: true,
      },
      include: {
        items: {
          where: { isAvailable: true },
          include: {
            customizations: {
              include: {
                options: {
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    })

    const tables = await prisma.table.findMany({
      where: { restaurantId: restaurant.id, isActive: true },
      select: { id: true, label: true },
      orderBy: { label: "asc" },
    })

    const announcements = await prisma.announcement.findMany({
      where: {
        restaurantId: restaurant.id,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { id: true, message: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    })

    const { plan, planValidUntil, latitude, longitude, country, ...publicRestaurant } = restaurant
    const arEnabled = hasFeature({ plan, planValidUntil }, "ar")
    const brandingEnabled = hasFeature({ plan, planValidUntil }, "branding")

    const paymentAccount = await prisma.restaurantPaymentAccount.findUnique({
      where: { restaurantId: restaurant.id },
    })
    const onlinePaymentEnabled = gatewayForRestaurant({ country }).isReady(paymentAccount)

    const feeConfig = await prisma.restaurantFeeConfig.findUnique({
      where: { restaurantId: restaurant.id },
    })
    const fees = feeConfig
      ? {
          delivery: {
            enabled: feeConfig.deliveryFeeEnabled,
            mode: feeConfig.deliveryFeeMode,
            amount: Number(feeConfig.deliveryFeeAmount),
          },
          convenience: {
            enabled: feeConfig.convenienceFeeEnabled,
            mode: feeConfig.convenienceFeeMode,
            amount: Number(feeConfig.convenienceFeeAmount),
          },
        }
      : null

    return success({
      restaurant: {
        ...publicRestaurant,
        primaryColor: brandingEnabled ? restaurant.primaryColor : DEFAULT_BRAND_COLOR,
        themeMode: brandingEnabled ? restaurant.themeMode : "LIGHT",
        hasLocation: latitude != null && longitude != null,
        arEnabled,
        onlinePaymentEnabled,
        fees,
        currency: currencyForCountry(country),
      },
      categories: arEnabled
        ? categories
        : categories.map((category) => ({
            ...category,
            items: category.items.map((item) => ({
              ...item,
              model3dUrl: null,
              model3dUsdzUrl: null,
              model3dPosterUrl: null,
            })),
          })),
      tables,
      announcements,
    })
  } catch (err) {
    return handleError(err)
  }
}
