import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import type { JwtPayload } from "@orderkaro/shared"

const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret"
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev-refresh-secret"
const JWT_EXPIRY = "15m"
const JWT_REFRESH_EXPIRY = "7d"

export function success(data: unknown = null, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function created(data: unknown) {
  return NextResponse.json({ success: true, data }, { status: 201 })
}

export function error(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export function getUser(request: NextRequest): JwtPayload | null {
  const header = request.headers.get("authorization")
  if (!header?.startsWith("Bearer ")) return null
  try {
    return jwt.verify(header.split(" ")[1], JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

export function requireAuth(request: NextRequest): JwtPayload {
  const user = getUser(request)
  if (!user) throw new AuthError("No token provided", 401)
  return user
}

export function requireRole(request: NextRequest, ...roles: string[]): JwtPayload {
  const user = requireAuth(request)
  if (!roles.includes(user.role)) throw new AuthError("Insufficient permissions", 403)
  return user
}

export function generateAccessToken(payload: JwtPayload, expiresIn?: string): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn || JWT_EXPIRY } as jwt.SignOptions)
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY } as jwt.SignOptions)
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function handleError(err: unknown) {
  if (err instanceof AuthError) {
    return error(err.message, err.status)
  }
  console.error(err)
  return error("Internal server error", 500)
}

export function parseBody<T>(schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: any } }, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const messages = result.error.errors.map((e: any) => `${e.path.join(".")}: ${e.message}`).join(", ")
    throw new AuthError(messages, 422)
  }
  return result.data as T
}
