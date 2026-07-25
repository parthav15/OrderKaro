import * as SecureStore from "expo-secure-store"

const TOKEN_KEY = "vm-staff-token"
const REFRESH_KEY = "vm-staff-refresh"
const PROFILE_KEY = "vm-staff-profile"

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://visionmenu.app"

export interface StaffProfile {
  id: string
  name: string
  role: "MANAGER" | "KITCHEN" | "COUNTER"
  restaurantId: string
}

export async function getStaffToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function getStaffProfile(): Promise<StaffProfile | null> {
  const raw = await SecureStore.getItemAsync(PROFILE_KEY)
  return raw ? (JSON.parse(raw) as StaffProfile) : null
}

async function persistSession(staff: StaffProfile, accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, accessToken)
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken)
  await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(staff))
}

async function resolveRestaurantId(handle: string): Promise<string> {
  const response = await fetch(
    `${API_URL}/api/v1/public/restaurant/${encodeURIComponent(handle)}/menu`
  )
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.success) {
    throw new Error("No restaurant found for that handle")
  }
  return payload.data.restaurant.id as string
}

export async function staffLogin(
  handle: string,
  email: string,
  password: string
): Promise<StaffProfile> {
  const restaurantId = await resolveRestaurantId(handle)
  const response = await fetch(`${API_URL}/api/v1/auth/staff/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ restaurantId, email, password }),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || "Invalid credentials")
  }
  const staff = payload.data.staff as StaffProfile
  await persistSession(staff, payload.data.accessToken, payload.data.refreshToken)
  return staff
}

export async function staffRefresh(): Promise<boolean> {
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

export async function staffSignOut() {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
  await SecureStore.deleteItemAsync(REFRESH_KEY)
  await SecureStore.deleteItemAsync(PROFILE_KEY)
}
