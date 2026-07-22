import { Prisma } from "@prisma/client"
import { AUTO_PICKUP_MINUTES } from "@orderkaro/shared"

export function activeOrderWhere(): Prisma.OrderWhereInput {
  const readyCutoff = new Date(Date.now() - AUTO_PICKUP_MINUTES * 60_000)
  return {
    OR: [
      { status: { in: ["PLACED", "ACCEPTED", "PREPARING"] } },
      { status: "READY", readyAt: { gte: readyCutoff } },
    ],
  }
}
