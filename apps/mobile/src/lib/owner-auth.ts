import * as SecureStore from "expo-secure-store"

const TOKEN_KEY = "vm-owner-token"
const REFRESH_KEY = "vm-owner-refresh"
const PROFILE_KEY = "vm-owner-profile"

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://visionmenu.app"

export interface OwnerProfile {
  id: string
  name: string
  email: string
}

export async function getOwnerToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function getOwnerProfile(): Promise<OwnerProfile | null> {
  const raw = await SecureStore.getItemAsync(PROFILE_KEY)
  return raw ? (JSON.parse(raw) as OwnerProfile) : null
}

async function persistSession(
  owner: OwnerProfile,
  accessToken: string,
  refreshToken: string
) {
  await SecureStore.setItemAsync(TOKEN_KEY, accessToken)
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken)
  await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(owner))
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || "Something went wrong")
  }
  return payload.data as T
}

export async function ownerLogin(email: string, password: string): Promise<OwnerProfile> {
  const data = await postJson<{
    owner: OwnerProfile
    accessToken: string
    refreshToken: string
  }>("/api/v1/auth/owner/login", { email, password })
  await persistSession(data.owner, data.accessToken, data.refreshToken)
  return data.owner
}

export async function ownerRegister(
  name: string,
  email: string,
  phone: string,
  password: string
): Promise<OwnerProfile> {
  const data = await postJson<{
    owner: OwnerProfile
    accessToken: string
    refreshToken: string
  }>("/api/v1/auth/owner/register", { name, email, phone, password })
  await persistSession(data.owner, data.accessToken, data.refreshToken)
  return data.owner
}

export async function ownerForgotPassword(email: string): Promise<string | null> {
  const data = await postJson<{ sent: boolean; phoneHint?: string }>(
    "/api/v1/auth/owner/forgot-password",
    { email }
  )
  return data.phoneHint ?? null
}

export async function ownerResetPassword(
  email: string,
  code: string,
  password: string
): Promise<OwnerProfile> {
  const data = await postJson<{
    owner: OwnerProfile
    accessToken: string
    refreshToken: string
  }>("/api/v1/auth/owner/reset-password", { email, code, password })
  await persistSession(data.owner, data.accessToken, data.refreshToken)
  return data.owner
}

export async function ownerRefresh(): Promise<boolean> {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY)
  if (!refreshToken) return false
  try {
    const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
    const payload = await response.json()
    if (!response.ok || !payload?.success) return false
    await SecureStore.setItemAsync(TOKEN_KEY, payload.data.accessToken)
    await SecureStore.setItemAsync(REFRESH_KEY, payload.data.refreshToken)
    return true
  } catch {
    return false
  }
}

export async function ownerSignOut() {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
  await SecureStore.deleteItemAsync(REFRESH_KEY)
  await SecureStore.deleteItemAsync(PROFILE_KEY)
}
