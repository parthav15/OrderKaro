import { NextRequest } from "next/server"
import { randomUUID } from "crypto"
import { Decimal } from "@prisma/client/runtime/library"
import prisma from "@/lib/prisma"
import {
  success,
  created,
  error,
  handleError,
  requireRole,
  parseBody,
  AuthError,
} from "@/lib/api-utils"
import {
  placeOrderSchema,
  ORDER_STATUS_FLOW,
  CANCEL_WINDOW_MS,
} from "@orderkaro/shared"
import type { OrderStatus } from "@prisma/client"
import { distanceInKm, roundKm } from "@/lib/geo"
import { gatewayForRestaurant, currencyForCountry } from "@/lib/payments"
import { resolveAppUrl } from "@/lib/app-url"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params
    const user = requireRole(request, "CONSUMER")
    const body = await request.json()
    const data = parseBody(placeOrderSchema, body)

    const existingOrder = await prisma.order.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
      include: { items: true },
    })
    if (existingOrder) return success(existingOrder)

    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } })
    if (!restaurant) throw new AuthError("Restaurant not found", 404)

    const activeStatuses: OrderStatus[] = ["PLACED", "ACCEPTED", "PREPARING", "READY"]

    const restaurantActiveCount = await prisma.order.count({
      where: { restaurantId, status: { in: activeStatuses } },
    })
    const maxActive = restaurant.maxActiveOrders ?? 50
    if (restaurantActiveCount >= maxActive) throw new AuthError("Restaurant is at capacity", 429)

    const consumerActiveCount = await prisma.order.count({
      where: { consumerId: user.id, restaurantId, status: { in: activeStatuses } },
    })
    if (consumerActiveCount >= 3) throw new AuthError("You already have 3 active orders", 429)

    if (data.orderType === "DINE_IN") {
      const table = await prisma.table.findFirst({
        where: { id: data.tableId, restaurantId, isActive: true },
      })
      if (!table) throw new AuthError("Table not found or inactive", 404)
    }

    const menuItemIds = data.items.map((i) => i.menuItemId)
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      include: { customizations: { include: { options: true } }, category: true },
    })

    const menuItemMap = new Map(menuItems.map((m) => [m.id, m]))

    for (const item of data.items) {
      const menuItem = menuItemMap.get(item.menuItemId)
      if (!menuItem) throw new AuthError(`Menu item ${item.menuItemId} not found`, 404)
      if (!menuItem.isAvailable) throw new AuthError(`${menuItem.name} is not available`, 400)
      const menuCategory = await prisma.category.findUnique({
        where: { id: menuItem.categoryId },
      })
      if (!menuCategory || !menuCategory.isActive)
        throw new AuthError(`${menuItem.name} category is inactive`, 400)
    }

    const orderItemsData = data.items.map((item) => {
      const menuItem = menuItemMap.get(item.menuItemId)!
      let unitPrice = new Decimal(menuItem.price.toString())

      for (const sel of item.selectedOptions ?? []) {
        const customization = menuItem.customizations.find((c) => c.id === sel.customizationId)
        if (!customization) continue
        for (const optId of sel.optionIds) {
          const opt = customization.options.find((o) => o.id === optId)
          if (opt) unitPrice = unitPrice.add(new Decimal(opt.priceAdjustment.toString()))
        }
      }

      const totalPrice = unitPrice.mul(new Decimal(item.quantity))
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        selectedOptions: item.selectedOptions ?? [],
        notes: item.notes,
      }
    })

    const itemsSubtotal = orderItemsData.reduce(
      (sum, i) => sum.add(i.totalPrice),
      new Decimal(0)
    )

    let deliveryFee = new Decimal(0)
    let deliveryDistanceKm: number | null = null

    const deliveryZoneEnforced =
      data.orderType === "DELIVERY" &&
      restaurant.deliveryEnabled &&
      restaurant.latitude != null &&
      restaurant.longitude != null

    if (deliveryZoneEnforced) {
      if (data.deliveryLatitude == null || data.deliveryLongitude == null) {
        throw new AuthError("Share your location to place a delivery order", 422)
      }
      const distance = roundKm(
        distanceInKm(
          restaurant.latitude!,
          restaurant.longitude!,
          data.deliveryLatitude,
          data.deliveryLongitude
        )
      )
      if (distance > restaurant.deliveryRadiusKm) {
        throw new AuthError(
          `You are ${distance} km away. ${restaurant.name} delivers within ${restaurant.deliveryRadiusKm} km.`,
          422
        )
      }
      const minOrderValue = new Decimal(restaurant.minOrderValue.toString())
      if (minOrderValue.gt(itemsSubtotal)) {
        throw new AuthError(
          `Minimum order value for delivery is ₹${minOrderValue.toFixed(2)}`,
          422
        )
      }
      deliveryDistanceKm = distance
      deliveryFee = new Decimal(restaurant.deliveryFee.toString())
    }

    const totalAmount = itemsSubtotal.add(deliveryFee)

    let walletTransactionId: string | undefined

    if (data.paymentMethod === "WALLET") {
      const wallet = await prisma.wallet.findUnique({ where: { consumerId: user.id } })
      if (!wallet) throw new AuthError("Wallet not found", 404)
      if (new Decimal(wallet.balance.toString()).lt(totalAmount))
        throw new AuthError("Insufficient wallet balance", 400)

      const walletTx = await prisma.$transaction(async (tx) => {
        const w = await tx.wallet.findUnique({ where: { consumerId: user.id } })
        if (!w) throw new AuthError("Wallet not found", 404)
        const balanceBefore = new Decimal(w.balance.toString())
        if (balanceBefore.lt(totalAmount)) throw new AuthError("Insufficient wallet balance", 400)
        const balanceAfter = balanceBefore.sub(totalAmount)
        await tx.wallet.update({
          where: { id: w.id },
          data: { balance: balanceAfter },
        })
        return tx.walletTransaction.create({
          data: {
            walletId: w.id,
            type: "DEBIT",
            amount: totalAmount,
            balanceBefore,
            balanceAfter,
            source: "ORDER_PAYMENT",
            description: `Payment for order at ${restaurant.name}`,
            status: "APPROVED",
          },
        })
      })
      walletTransactionId = walletTx.id
    }

    let onlinePaymentAccount: Awaited<
      ReturnType<typeof prisma.restaurantPaymentAccount.findUnique>
    > = null

    if (data.paymentMethod === "ONLINE") {
      onlinePaymentAccount = await prisma.restaurantPaymentAccount.findUnique({
        where: { restaurantId },
      })
      const gateway = gatewayForRestaurant(restaurant)
      if (!onlinePaymentAccount || !gateway.isReady(onlinePaymentAccount)) {
        throw new AuthError(
          `${restaurant.name} has not set up online payments yet. Please choose cash or wallet.`,
          422
        )
      }
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const todayOrderCount = await prisma.order.count({
      where: {
        restaurantId,
        placedAt: { gte: todayStart, lte: todayEnd },
      },
    })
    const orderNumber = todayOrderCount + 1
    const trackingToken = randomUUID()

    const order = await prisma.order.create({
      data: {
        orderNumber,
        restaurantId,
        orderType: data.orderType,
        tableId: data.orderType === "DINE_IN" ? data.tableId : null,
        deliveryLocation: data.orderType === "DELIVERY" ? data.deliveryLocation : null,
        deliveryLatitude: data.orderType === "DELIVERY" ? data.deliveryLatitude ?? null : null,
        deliveryLongitude: data.orderType === "DELIVERY" ? data.deliveryLongitude ?? null : null,
        deliveryDistanceKm,
        deliveryFee: deliveryZoneEnforced ? deliveryFee : null,
        consumerId: user.id,
        status: data.paymentMethod === "ONLINE" ? "AWAITING_PAYMENT" : "PLACED",
        totalAmount,
        specialInstructions: data.specialInstructions,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentMethod === "WALLET" ? "PAID" : "PENDING",
        walletTransactionId: walletTransactionId ?? null,
        idempotencyKey: data.idempotencyKey,
        trackingToken,
        items: {
          create: orderItemsData,
        },
        statusLogs: {
          create: {
            fromStatus: null,
            toStatus: data.paymentMethod === "ONLINE" ? "AWAITING_PAYMENT" : "PLACED",
            changedBy: user.id,
            note: data.paymentMethod === "ONLINE" ? "Awaiting online payment" : "Order placed",
          },
        },
      },
      include: { items: true, table: true },
    })

    const appUrl = resolveAppUrl(request)
    const trackingUrl = `${appUrl}/${restaurant.slug}/track/${trackingToken}`

    if (data.paymentMethod === "ONLINE" && onlinePaymentAccount) {
      const gateway = gatewayForRestaurant(restaurant)
      const commissionPercent = new Decimal(restaurant.commissionPercent.toString())
      const platformFee = gateway.supportsPlatformFee
        ? totalAmount.mul(commissionPercent).div(100)
        : new Decimal(0)

      const returnUrl = `${appUrl}/api/v1/payments/return/${order.id}`
      const payer = await prisma.consumer.findUnique({
        where: { id: user.id },
        select: { name: true, phone: true },
      })

      try {
        const session = await gateway.createCheckout(onlinePaymentAccount, {
          orderId: order.id,
          amount: Number(totalAmount.toFixed(2)),
          currency: currencyForCountry(restaurant.country),
          platformFee: Number(platformFee.toFixed(2)),
          description: `Order #${order.orderNumber} at ${restaurant.name}`,
          customer: { name: payer?.name ?? "Guest", phone: payer?.phone },
          successUrl: returnUrl,
          failureUrl: returnUrl,
        })

        const withPayment = await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentProvider: gateway.provider,
            paymentOrderId: session.providerOrderId,
            paymentRedirectUrl: session.redirectUrl,
            platformFee,
          },
          include: { items: true, table: true },
        })

        return created({
          ...withPayment,
          trackingUrl,
          paymentRedirectUrl: session.redirectUrl,
        })
      } catch (paymentError) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED", cancelledAt: new Date() },
        })
        throw paymentError
      }
    }

    return created({ ...order, trackingUrl })
  } catch (err) {
    return handleError(err)
  }
}
