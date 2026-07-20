import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { success, handleError, generateAccessToken, parseBody } from "@/lib/api-utils"
import { identifyConsumerSchema } from "@orderkaro/shared"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = parseBody(identifyConsumerSchema, body)

    const consumer = await prisma.consumer.upsert({
      where: { phone: data.phone },
      update: { name: data.name },
      create: { phone: data.phone, name: data.name },
      select: { id: true, name: true, phone: true },
    })

    let balance = "0"
    if (data.slug) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { slug: data.slug },
        select: { id: true },
      })
      if (restaurant) {
        const wallet = await prisma.wallet.upsert({
          where: {
            consumerId_restaurantId: { consumerId: consumer.id, restaurantId: restaurant.id },
          },
          update: {},
          create: { consumerId: consumer.id, restaurantId: restaurant.id },
          select: { balance: true },
        })
        balance = wallet.balance.toString()
      }
    }

    const accessToken = generateAccessToken({ id: consumer.id, role: "CONSUMER" }, "24h")

    return success({
      consumer,
      wallet: { balance },
      accessToken,
    })
  } catch (err) {
    return handleError(err)
  }
}
