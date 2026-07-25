import { getStaffToken, staffRefresh } from "./staff-auth"

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://visionmenu.app"

export class StaffApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function staffRequest<T>(
  path: string,
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown,
  retry = true
): Promise<T> {
  const token = await getStaffToken()
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (response.status === 401 && retry) {
    const refreshed = await staffRefresh()
    if (refreshed) return staffRequest<T>(path, method, body, false)
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok || (payload && payload.success === false)) {
    throw new StaffApiError(
      (payload && (payload.error as string)) || `Request failed (${response.status})`,
      response.status
    )
  }
  return (payload?.data ?? payload) as T
}

export const staffApi = {
  get: <T>(path: string) => staffRequest<T>(path, "GET"),
  post: <T>(path: string, body?: unknown) => staffRequest<T>(path, "POST", body),
  patch: <T>(path: string, body?: unknown) => staffRequest<T>(path, "PATCH", body),
  put: <T>(path: string, body?: unknown) => staffRequest<T>(path, "PUT", body),
  delete: <T>(path: string, body?: unknown) => staffRequest<T>(path, "DELETE", body),
}
