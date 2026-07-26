import type { NextRequest } from "next/server"
import { AuthError } from "@/lib/api-utils"

export function requireCron(request: NextRequest): void {
  const secret = process.env.CRON_SECRET
  if (!secret) throw new AuthError("Cron is not configured", 503)
  const header = request.headers.get("authorization")
  if (header !== `Bearer ${secret}`) throw new AuthError("Unauthorized cron request", 401)
}
