import { NextRequest } from "next/server"
import {
  success,
  error,
  handleError,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  parseBody,
  CONSUMER_ACCESS_EXPIRY,
} from "@/lib/api-utils"
import { refreshTokenSchema } from "@orderkaro/shared"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = parseBody(refreshTokenSchema, body)

    const payload = verifyRefreshToken(data.refreshToken)

    const tokenPayload = {
      id: payload.id,
      role: payload.role,
      ...(payload.restaurantId && { restaurantId: payload.restaurantId }),
    }

    const accessToken = generateAccessToken(
      tokenPayload,
      payload.role === "CONSUMER" ? CONSUMER_ACCESS_EXPIRY : undefined
    )
    const refreshToken = generateRefreshToken(tokenPayload)

    return success({ accessToken, refreshToken })
  } catch (err) {
    return handleError(err)
  }
}
