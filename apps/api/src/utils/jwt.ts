import jwt from "jsonwebtoken"
import type { JwtPayload } from "@orderkaro/shared"
import env from "../config/env"

export function generateAccessToken(payload: JwtPayload, expiresIn?: string): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: expiresIn || env.JWT_EXPIRY } as jwt.SignOptions)
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
  } as jwt.SignOptions)
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload
}
