import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, error, handleError } from "@/lib/api-utils"

export async function GET(
  request: NextRequest,
  { params }: { params: { trackingToken: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { trackingToken: params.trackingToken },
      include: {
        items: {
          include: {
            menuItem: {
              select: { id: true, name: true, imageUrl: true },
            },
          },
        },
        table: {
          select: { id: true, label: true, section: true },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            avgPrepTime: true,
            whatsappEnabled: true,
          },
        },
      },
    })

    if (!order) {
      return error("Order not found", 404)
    }

    const settings = await prisma.smsSettings.findUnique({ where: { id: "singleton" } })
    const whatsappOptIn =
      settings?.whatsappEnabled && order.restaurant.whatsappEnabled && settings.whatsappSender
        ? {
            number: settings.whatsappSender.replace(/\D/g, ""),
            message: `Hi ${order.restaurant.name}, please keep me updated on order #${order.orderNumber}.`,
          }
        : null

    return success({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      orderType: order.orderType,
      deliveryLocation: order.deliveryLocation,
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      specialInstructions: order.specialInstructions,
      estimatedReadyAt: order.estimatedReadyAt,
      placedAt: order.placedAt,
      acceptedAt: order.acceptedAt,
      preparingAt: order.preparingAt,
      readyAt: order.readyAt,
      pickedUpAt: order.pickedUpAt,
      cancelledAt: order.cancelledAt,
      items: order.items,
      table: order.table,
      restaurant: order.restaurant,
      whatsappOptIn,
    })
  } catch (err) {
    return handleError(err)
  }
}
