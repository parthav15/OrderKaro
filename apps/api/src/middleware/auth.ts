import type { Request, Response, NextFunction } from "express"
import { verifyAccessToken } from "../utils/jwt"
import type { JwtPayload } from "@orderkaro/shared"
import { error } from "../utils/response"

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith("Bearer ")) {
    return error(res, "No token provided", 401)
  }

  try {
    const token = header.split(" ")[1]
    req.user = verifyAccessToken(token)
    next()
  } catch {
    return error(res, "Invalid or expired token", 401)
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return error(res, "Not authenticated", 401)
    }
    if (!roles.includes(req.user.role)) {
      return error(res, "Insufficient permissions", 403)
    }
    next()
  }
}
