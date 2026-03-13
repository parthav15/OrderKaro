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
        canteen: {
          select: { id: true, name: true, slug: true, logoUrl: true, avgPrepTime: true },
        },
      },
    })

    if (!order) {
      return error("Order not found", 404)
    }

    return success({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
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
      canteen: order.canteen,
    })
  } catch (err) {
    return handleError(err)
  }
}
