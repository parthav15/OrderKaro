import * as SecureStore from "expo-secure-store"

const ACCESS_KEY = "vm-access-token"
const REFRESH_KEY = "vm-refresh-token"
const IDENTITY_KEY = "vm-identity"

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://order-karo-frontend.vercel.app"

export interface Identity {
  id: string
  name: string
  phone: string
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_KEY)
}

export async function getIdentity(): Promise<Identity | null> {
  const raw = await SecureStore.getItemAsync(IDENTITY_KEY)
  return raw ? (JSON.parse(raw) as Identity) : null
}

async function persistTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync(ACCESS_KEY, accessToken)
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken)
}

export async function requestOtp(phone: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/v1/public/otp/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error || "Couldn't send the code")
  }
}

export async function verifyOtp(
  name: string,
  phone: string,
  code: string
): Promise<Identity> {
  const response = await fetch(`${API_URL}/api/v1/public/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, phone, code }),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || "That code didn't work")
  }
  const data = payload.data
  const identity: Identity = {
    id: data.consumer.id,
    name: data.consumer.name,
    phone: data.consumer.phone,
  }
  await persistTokens(data.accessToken, data.refreshToken)
  await SecureStore.setItemAsync(IDENTITY_KEY, JSON.stringify(identity))
  return identity
}

export async function refresh(): Promise<boolean> {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY)
  if (!refreshToken) return false
  try {
    const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
    if (response.status === 401 || response.status === 403) {
      await signOut()
      return false
    }
    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload?.success) return false
    await persistTokens(payload.data.accessToken, payload.data.refreshToken)
    return true
  } catch {
    return false
  }
}

export async function signOut() {
  await SecureStore.deleteItemAsync(ACCESS_KEY)
  await SecureStore.deleteItemAsync(REFRESH_KEY)
  await SecureStore.deleteItemAsync(IDENTITY_KEY)
}
