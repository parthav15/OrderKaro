import Constants from "expo-constants"
import { getToken, refresh } from "./auth"

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra?.apiUrl as string) ||
  "https://order-karo-frontend.vercel.app"

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  auth?: boolean
  retryOn401?: boolean
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = false, retryOn401 = true } = options

  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (auth) {
    const token = await getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (response.status === 401 && auth && retryOn401) {
    const refreshed = await refresh()
    if (refreshed) return request<T>(path, { ...options, retryOn401: false })
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok || (payload && payload.success === false)) {
    const message =
      (payload && (payload.error as string)) || `Request failed (${response.status})`
    throw new ApiError(message, response.status)
  }

  return (payload?.data ?? payload) as T
}

export const api = {
  get: <T>(path: string, auth = false) => request<T>(path, { auth }),
  post: <T>(path: string, body?: unknown, auth = false) =>
    request<T>(path, { method: "POST", body, auth }),
  put: <T>(path: string, body?: unknown, auth = false) =>
    request<T>(path, { method: "PUT", body, auth }),
  patch: <T>(path: string, body?: unknown, auth = false) =>
    request<T>(path, { method: "PATCH", body, auth }),
  delete: <T>(path: string, auth = false) => request<T>(path, { method: "DELETE", auth }),
  rawUrl: API_URL,
}
