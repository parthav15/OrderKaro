const STATIC_CACHE = "orderkaro-static-v1"
const API_CACHE = "orderkaro-api-v1"

const STATIC_ASSETS = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
]

const API_CACHE_PATTERNS = [
  /\/api\/v1\/public\/canteen\/[^/]+\/menu/,
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

function isApiCacheable(url) {
  return API_CACHE_PATTERNS.some((pattern) => pattern.test(url))
}

async function handleApiRequest(request) {
  try {
    const networkResponse = await fetch(request.clone())
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return new Response(
      JSON.stringify({ error: "Offline", offline: true }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    )
  }
}

async function handleStaticRequest(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch {
    const url = new URL(request.url)
    if (request.mode === "navigate" || url.pathname === "/") {
      const offlinePage = await caches.match("/offline.html")
      if (offlinePage) return offlinePage
    }
    return new Response("Offline", { status: 503 })
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== "GET") return

  if (isApiCacheable(url.pathname + url.search)) {
    event.respondWith(handleApiRequest(request))
    return
  }

  if (url.origin === self.location.origin) {
    event.respondWith(handleStaticRequest(request))
    return
  }
})

self.addEventListener("push", (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag || "orderkaro",
      data: { url: data.url || "/" },
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || "/"
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(targetUrl))
      if (existing) return existing.focus()
      return self.clients.openWindow(targetUrl)
    })
  )
})
