import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
  success,
  created,
  handleError,
  requireRole,
  parseBody,
} from "@/lib/api-utils"
import { createCanteenSchema } from "@orderkaro/shared"

export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, "OWNER")
    const canteens = await prisma.canteen.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
    })
    return success(canteens)
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, "OWNER")
    const body = await request.json()
    const data = parseBody(createCanteenSchema, body)
    const canteen = await prisma.canteen.create({
      data: { ...data, ownerId: user.id },
    })
    return created(canteen)
  } catch (err) {
    return handleError(err)
  }
}
