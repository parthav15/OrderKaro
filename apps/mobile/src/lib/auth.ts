import * as SecureStore from "expo-secure-store"

const TOKEN_KEY = "vm-access-token"
const IDENTITY_KEY = "vm-identity"

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://order-karo-frontend.vercel.app"

export interface Identity {
  id: string
  name: string
  phone: string
  slug?: string
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function getIdentity(): Promise<Identity | null> {
  const raw = await SecureStore.getItemAsync(IDENTITY_KEY)
  return raw ? (JSON.parse(raw) as Identity) : null
}

async function persist(token: string, identity: Identity) {
  await SecureStore.setItemAsync(TOKEN_KEY, token)
  await SecureStore.setItemAsync(IDENTITY_KEY, JSON.stringify(identity))
}

export async function identify(
  name: string,
  phone: string,
  slug?: string
): Promise<{ identity: Identity; walletBalance: string }> {
  const response = await fetch(`${API_URL}/api/v1/public/identify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, phone, slug }),
  })
  const payload = await response.json()
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || "Could not sign in")
  }
  const data = payload.data
  const identity: Identity = {
    id: data.consumer.id,
    name: data.consumer.name,
    phone: data.consumer.phone,
    slug,
  }
  await persist(data.accessToken, identity)
  return { identity, walletBalance: data.wallet?.balance ?? "0" }
}

export async function reidentify(): Promise<boolean> {
  const identity = await getIdentity()
  if (!identity) return false
  try {
    await identify(identity.name, identity.phone, identity.slug)
    return true
  } catch {
    return false
  }
}

export async function signOut() {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
  await SecureStore.deleteItemAsync(IDENTITY_KEY)
}
