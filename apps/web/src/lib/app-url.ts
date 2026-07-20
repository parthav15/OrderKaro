import type { NextRequest } from "next/server"

export function resolveAppUrl(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL
  if (configured) return configured.replace(/\/$/, "")

  const origin = request.headers.get("origin")
  if (origin) return origin.replace(/\/$/, "")

  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host")
  const forwardedProto =
    request.headers.get("x-forwarded-proto") ??
    (forwardedHost?.startsWith("localhost") ? "http" : "https")

  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`

  return new URL(request.url).origin
}
