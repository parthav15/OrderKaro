import { getOwnerToken, ownerRefresh } from "./owner-auth"

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://order-karo-frontend.vercel.app"

export class OwnerApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function ownerRequest<T>(
  path: string,
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown,
  retry = true
): Promise<T> {
  const token = await getOwnerToken()
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (response.status === 401 && retry) {
    const refreshed = await ownerRefresh()
    if (refreshed) return ownerRequest<T>(path, method, body, false)
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok || (payload && payload.success === false)) {
    throw new OwnerApiError(
      (payload && (payload.error as string)) || `Request failed (${response.status})`,
      response.status
    )
  }
  return (payload?.data ?? payload) as T
}

export const ownerApi = {
  get: <T>(path: string) => ownerRequest<T>(path, "GET"),
  post: <T>(path: string, body?: unknown) => ownerRequest<T>(path, "POST", body),
  patch: <T>(path: string, body?: unknown) => ownerRequest<T>(path, "PATCH", body),
}
