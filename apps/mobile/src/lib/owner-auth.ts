import * as SecureStore from "expo-secure-store"

const TOKEN_KEY = "vm-owner-token"
const REFRESH_KEY = "vm-owner-refresh"
const PROFILE_KEY = "vm-owner-profile"

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://order-karo-frontend.vercel.app"

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

export async function ownerLogin(email: string, password: string): Promise<OwnerProfile> {
  const response = await fetch(`${API_URL}/api/v1/auth/owner/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  const payload = await response.json()
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || "Invalid credentials")
  }
  const { owner, accessToken, refreshToken } = payload.data
  await SecureStore.setItemAsync(TOKEN_KEY, accessToken)
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken)
  await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(owner))
  return owner as OwnerProfile
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
