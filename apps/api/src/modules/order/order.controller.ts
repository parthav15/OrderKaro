import type { Request, Response } from "express"
import { Decimal } from "@prisma/client/runtime/library"
import type { OrderStatus } from "@prisma/client"
import { randomUUID } from "crypto"
import prisma from "../../config/database"
import { success, error, created } from "../../utils/response"
import { ORDER_STATUS_FLOW, CANCEL_WINDOW_MS } from "@orderkaro/shared"
import type { PlaceOrderInput, UpdateOrderStatusInput, CollectCashPaymentInput } from "@orderkaro/shared"
import { getIO } from "../../socket"
import env from "../../config/env"

export async function placeOrder(req: Request, res: Response) {
  const data = req.body as PlaceOrderInput
  const consumerId = req.user!.id
  const canteenId = req.params.canteenId as string

  if (data.idempotencyKey) {
    const existing = await prisma.order.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
    })
    if (existing) {
      return success(res, existing)
    }
  }

  const activeStatuses: OrderStatus[] = ["PLACED", "ACCEPTED", "PREPARING", "READY"]

  const [canteenWithThreshold, canteenActiveOrderCount, consumerActiveOrderCount] =
    await Promise.all([
      prisma.canteen.findUnique({
        where: { id: canteenId },
        select: { avgPrepTime: true, maxActiveOrders: true },
      }),
      prisma.order.count({
        where: { canteenId, status: { in: activeStatuses } },
      }),
      prisma.order.count({
        where: { consumerId, canteenId, status: { in: activeStatuses } },
      }),
    ])

  const maxActiveOrders = canteenWithThreshold?.maxActiveOrders ?? 50

  if (canteenActiveOrderCount >= maxActiveOrders) {
    return error(res, "Kitchen is busy. Please try again in a few minutes.", 429)
  }

  if (consumerActiveOrderCount >= 3) {
    return error(res, "You already have too many active orders. Please wait for them to be picked up.", 429)
  }

  const table = await prisma.table.findFirst({
    where: { id: data.tableId, canteenId, isActive: true },
  })
  if (!table) {
    return error(res, "Invalid table", 400)
  }

  const menuItemIds = data.items.map((i) => i.menuItemId)
  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: menuItemIds },
      category: { canteenId },
      isAvailable: true,
    },
    include: {
      customizations: { include: { options: true } },
    },
  })

  if (menuItems.length !== menuItemIds.length) {
    return error(res, "Some items are unavailable or not found", 400)
  }

  const menuItemMap = new Map(menuItems.map((item) => [item.id, item]))

  let totalAmount = new Decimal(0)
  const orderItemsData = data.items.map((item) => {
    const menuItem = menuItemMap.get(item.menuItemId)!
    let unitPrice = new Decimal(menuItem.price)

    const selectedOptionsSnapshot: Array<{
      customizationName: string
      options: Array<{ name: string; priceAdjustment: number }>
    }> = []

    for (const selection of item.selectedOptions) {
      const customization = menuItem.customizations.find(
        (c) => c.id === selection.customizationId
      )
      if (!customization) continue

      const selectedOpts = customization.options.filter((o) =>
        selection.optionIds.includes(o.id)
      )

      for (const opt of selectedOpts) {
        unitPrice = unitPrice.add(new Decimal(opt.priceAdjustment))
      }

      selectedOptionsSnapshot.push({
        customizationName: customization.name,
        options: selectedOpts.map((o) => ({
          name: o.name,
          priceAdjustment: Number(o.priceAdjustment),
        })),
      })
    }

    const totalPrice = unitPrice.mul(item.quantity)
    totalAmount = totalAmount.add(totalPrice)

    return {
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      unitPrice,
      totalPrice,
      selectedOptions: selectedOptionsSnapshot,
      notes: item.notes,
    }
  })

  if (data.paymentMethod === "WALLET") {
    const wallet = await prisma.wallet.findUnique({ where: { consumerId } })
    if (!wallet || wallet.balance.lessThan(totalAmount)) {
      return error(res, "Insufficient wallet balance", 400)
    }
  }

  const estimatedReadyAt = new Date(
    Date.now() + (canteenWithThreshold?.avgPrepTime || 15) * 60 * 1000
  )

  let order
  try {
    order = await prisma.$transaction(async (tx) => {
    let walletSnapshot: { id: string; balance: Decimal } | null = null

    if (data.paymentMethod === "WALLET") {
      walletSnapshot = await tx.wallet.findUnique({ where: { consumerId } })
      if (!walletSnapshot || walletSnapshot.balance.lessThan(totalAmount)) {
        throw new Error("INSUFFICIENT_BALANCE")
      }
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const lastOrder = await tx.order.findFirst({
      where: { canteenId, placedAt: { gte: todayStart } },
      orderBy: { orderNumber: "desc" },
    })
    const orderNumber = (lastOrder?.orderNumber || 0) + 1

    const trackingToken = randomUUID()

    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        canteenId,
        tableId: data.tableId,
        consumerId,
        totalAmount,
        specialInstructions: data.specialInstructions,
        estimatedReadyAt,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentMethod === "WALLET" ? "PAID" : "PENDING",
        idempotencyKey: data.idempotencyKey,
        trackingToken,
        items: { create: orderItemsData },
        statusLogs: {
          create: { toStatus: "PLACED", changedBy: consumerId },
        },
      },
      include: {
        items: { include: { menuItem: { select: { name: true } } } },
        table: { select: { label: true } },
        canteen: { select: { slug: true } },
      },
    })

    if (data.paymentMethod === "WALLET" && walletSnapshot) {
      await tx.wallet.update({
        where: { consumerId },
        data: { balance: { decrement: totalAmount } },
      })

      await tx.walletTransaction.create({
        data: {
          walletId: walletSnapshot.id,
          type: "DEBIT",
          amount: totalAmount,
          balanceBefore: walletSnapshot.balance,
          balanceAfter: walletSnapshot.balance.sub(totalAmount),
          source: "ORDER_PAYMENT",
          description: `Order #${orderNumber}`,
          reference: newOrder.id,
        },
      })
    }

    return newOrder
    })
  } catch (err) {
    if (err instanceof Error && err.message === "INSUFFICIENT_BALANCE") {
      return error(res, "Insufficient wallet balance", 400)
    }
    throw err
  }

  const io = getIO()
  io.to(`canteen:${canteenId}:kitchen`).emit("order:new", order)
  io.to(`canteen:${canteenId}:counter`).emit("order:new", order)

  const trackingUrl = `${env.APP_URL}/${order.canteen.slug}/track/${order.trackingToken}`

  return created(res, { ...order, trackingUrl })
}

export async function getOrder(req: Request, res: Response) {
  const orderId = req.params.orderId as string
  const canteenId = req.params.canteenId as string
  const user = req.user!

  const order = await prisma.order.findFirst({
    where: { id: orderId, canteenId },
    include: {
      items: { include: { menuItem: { select: { name: true, imageUrl: true } } } },
      table: { select: { label: true } },
      statusLogs: { orderBy: { createdAt: "asc" } },
    },
  })
  if (!order) {
    return error(res, "Order not found", 404)
  }

  if (user.role === "CONSUMER" && order.consumerId !== user.id) {
    return error(res, "Forbidden", 403)
  }

  return success(res, order)
}

export async function getActiveOrders(req: Request, res: Response) {
  const orders = await prisma.order.findMany({
    where: {
      canteenId: req.params.canteenId as string,
      status: { in: ["PLACED", "ACCEPTED", "PREPARING", "READY"] },
    },
    include: {
      items: { include: { menuItem: { select: { name: true } } } },
      table: { select: { label: true } },
    },
    orderBy: { placedAt: "asc" },
  })
  return success(res, orders)
}

export async function cancelOrder(req: Request, res: Response) {
  const order = await prisma.order.findFirst({
    where: {
      id: req.params.orderId as string,
      canteenId: req.params.canteenId as string,
      consumerId: req.user!.id,
    },
  })
  if (!order) {
    return error(res, "Order not found", 404)
  }

  const canCancel =
    order.status === "PLACED" ||
    (order.status === "ACCEPTED" &&
      Date.now() - order.placedAt.getTime() < CANCEL_WINDOW_MS)

  if (!canCancel) {
    return error(res, "Order cannot be cancelled at this stage", 400)
  }

  const cancelled = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        paymentStatus:
          order.paymentMethod === "WALLET" ? "REFUNDED" : order.paymentStatus,
      },
    })

    await tx.orderStatusLog.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: "CANCELLED",
        changedBy: req.user!.id,
      },
    })

    if (order.paymentMethod === "WALLET" && order.paymentStatus === "PAID") {
      const wallet = await tx.wallet.findUnique({
        where: { consumerId: order.consumerId },
      })
      if (wallet) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: order.totalAmount } },
        })
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "CREDIT",
            amount: order.totalAmount,
            balanceBefore: wallet.balance,
            balanceAfter: wallet.balance.add(order.totalAmount),
            source: "REFUND",
            description: `Refund for Order #${order.orderNumber}`,
            reference: order.id,
          },
        })
      }
    }

    return updated
  })

  const io = getIO()
  const cancelledCanteenId = req.params.canteenId as string
  io.to(`canteen:${cancelledCanteenId}:kitchen`).emit("order:cancelled", {
    orderId: order.id,
  })
  io.to(`canteen:${cancelledCanteenId}:counter`).emit("order:cancelled", {
    orderId: order.id,
  })
  io.to(`order:${order.id}`).emit("order:cancelled", { orderId: order.id })

  return success(res, cancelled)
}

export async function updateOrderStatus(req: Request, res: Response) {
  const { status, note } = req.body as UpdateOrderStatusInput

  const order = await prisma.order.findFirst({
    where: { id: req.params.orderId as string, canteenId: req.params.canteenId as string },
  })
  if (!order) {
    return error(res, "Order not found", 404)
  }

  const allowedNext = ORDER_STATUS_FLOW[order.status] || []
  if (!allowedNext.includes(status)) {
    return error(res, `Cannot transition from ${order.status} to ${status}`, 400)
  }

  const timestamps: Record<string, Date> = {}
  if (status === "ACCEPTED") timestamps.acceptedAt = new Date()
  if (status === "PREPARING") timestamps.preparingAt = new Date()
  if (status === "READY") timestamps.readyAt = new Date()
  if (status === "PICKED_UP") timestamps.pickedUpAt = new Date()
  if (status === "CANCELLED") timestamps.cancelledAt = new Date()

  const updated = await prisma.$transaction(async (tx) => {
    const paymentUpdate: Record<string, string> = {}
    if (status === "PICKED_UP" && order.paymentMethod === "CASH") {
      paymentUpdate.paymentStatus = "PAID"
    }
    if (status === "CANCELLED" && order.paymentMethod === "WALLET") {
      paymentUpdate.paymentStatus = "REFUNDED"
    }

    const result = await tx.order.update({
      where: { id: order.id },
      data: { status, ...timestamps, ...paymentUpdate },
      include: {
        items: { include: { menuItem: { select: { name: true } } } },
        table: { select: { label: true } },
      },
    })

    await tx.orderStatusLog.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: status,
        changedBy: req.user!.id,
        note,
      },
    })

    if (
      status === "CANCELLED" &&
      order.paymentMethod === "WALLET" &&
      order.paymentStatus === "PAID"
    ) {
      const wallet = await tx.wallet.findUnique({
        where: { consumerId: order.consumerId },
      })
      if (wallet) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: order.totalAmount } },
        })
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "CREDIT",
            amount: order.totalAmount,
            balanceBefore: wallet.balance,
            balanceAfter: wallet.balance.add(order.totalAmount),
            source: "REFUND",
            description: `Refund for Order #${order.orderNumber}`,
            reference: order.id,
          },
        })
      }
    }

    return result
  })

  const io = getIO()
  const statusPayload = {
    orderId: order.id,
    status,
    estimatedReadyAt: updated.estimatedReadyAt,
  }

  io.to(`order:${order.id}`).emit("order:status", statusPayload)
  io.to(`canteen:${order.canteenId}:kitchen`).emit("order:status", statusPayload)
  io.to(`canteen:${order.canteenId}:counter`).emit("order:status", statusPayload)

  if (status === "READY") {
    const readyPayload = { orderId: order.id, orderNumber: order.orderNumber }
    io.to(`order:${order.id}`).emit("order:ready", readyPayload)
    io.to(`canteen:${order.canteenId}:counter`).emit("order:ready", readyPayload)
  }

  if (status === "CANCELLED") {
    const cancelPayload = { orderId: order.id }
    io.to(`order:${order.id}`).emit("order:cancelled", cancelPayload)
    io.to(`canteen:${order.canteenId}:kitchen`).emit("order:cancelled", cancelPayload)
    io.to(`canteen:${order.canteenId}:counter`).emit("order:cancelled", cancelPayload)
  }

  return success(res, updated)
}

export async function getOrderHistory(req: Request, res: Response) {
  const canteenId = req.params.canteenId as string
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const status = req.query.status as string | undefined
  const paymentMethod = req.query.paymentMethod as string | undefined
  const dateFrom = req.query.dateFrom as string | undefined
  const dateTo = req.query.dateTo as string | undefined

  const where: Record<string, unknown> = { canteenId }
  if (status) where.status = status
  if (paymentMethod) where.paymentMethod = paymentMethod
  if (dateFrom || dateTo) {
    const placedAt: Record<string, Date> = {}
    if (dateFrom) placedAt.gte = new Date(dateFrom)
    if (dateTo) placedAt.lte = new Date(dateTo + "T23:59:59")
    where.placedAt = placedAt
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: { include: { menuItem: { select: { name: true } } } },
        table: { select: { label: true } },
        consumer: { select: { name: true, phone: true } },
      },
      orderBy: { placedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])

  return success(res, {
    orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

export async function getConsumerOrders(req: Request, res: Response) {
  const consumerId = req.user!.id
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { consumerId },
      include: {
        items: { include: { menuItem: { select: { name: true } } } },
        table: { select: { label: true } },
        canteen: { select: { name: true, slug: true } },
      },
      orderBy: { placedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where: { consumerId } }),
  ])

  return success(res, {
    orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

export async function collectCashPayment(req: Request, res: Response) {
  const orderId = req.params.orderId as string
  const canteenId = req.params.canteenId as string
  const { amountReceived } = req.body as CollectCashPaymentInput

  const order = await prisma.order.findFirst({
    where: { id: orderId, canteenId },
    include: { consumer: { select: { id: true, name: true } } },
  })

  if (!order) {
    return error(res, "Order not found", 404)
  }

  if (order.paymentMethod !== "CASH") {
    return error(res, "This order is not a cash payment order", 400)
  }

  if (order.paymentStatus === "PAID") {
    return error(res, "Payment already collected for this order", 400)
  }

  const orderAmount = new Decimal(order.totalAmount)
  const received = new Decimal(amountReceived)

  if (received.lessThan(orderAmount)) {
    return error(res, `Amount received (₹${received}) is less than order total (₹${orderAmount})`, 400)
  }

  const change = received.sub(orderAmount)

  const result = await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { paymentStatus: "PAID" },
    })

    let walletCredited = false
    let newBalance = new Decimal(0)

    if (change.greaterThan(0)) {
      const wallet = await tx.wallet.findUnique({
        where: { consumerId: order.consumerId },
      })

      if (wallet) {
        newBalance = wallet.balance.add(change)

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: newBalance },
        })

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "CREDIT",
            amount: change,
            balanceBefore: wallet.balance,
            balanceAfter: newBalance,
            source: "CASH_DEPOSIT",
            description: `Change from Order #${order.orderNumber} (Paid ₹${received}, Order ₹${orderAmount})`,
            reference: order.id,
            approvedBy: req.user!.id,
          },
        })

        walletCredited = true
      }
    }

    return { walletCredited, changeAmount: Number(change), newBalance: Number(newBalance) }
  })

  return success(res, {
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderAmount: Number(orderAmount),
    amountReceived: Number(received),
    changeAmount: result.changeAmount,
    walletCredited: result.walletCredited,
    newWalletBalance: result.walletCredited ? result.newBalance : undefined,
    consumerName: order.consumer.name,
  })
}
