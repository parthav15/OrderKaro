"use client"

import { useCallback, useEffect, useRef } from "react"
import api from "@/lib/api"

const SESSION_STORAGE_KEY = "orderkaro-view-session"

function readSessionId(): string {
  if (typeof window === "undefined") return ""
  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY)
  if (existing) return existing
  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `s${Date.now()}${Math.floor(Math.random() * 1e6)}`
  window.localStorage.setItem(SESSION_STORAGE_KEY, generated)
  return generated
}

export function useViewTracking(slug: string, enabled: boolean) {
  const menuTracked = useRef(false)
  const trackedItems = useRef(new Set<string>())

  const send = useCallback(
    (payload: { menuItemId?: string; source: "MENU" | "ITEM" | "AR" }) => {
      const sessionId = readSessionId()
      if (!sessionId || !slug) return
      api
        .post(`/api/v1/public/restaurant/${slug}/view`, { sessionId, ...payload })
        .catch(() => undefined)
    },
    [slug]
  )

  useEffect(() => {
    if (!enabled || menuTracked.current) return
    menuTracked.current = true
    send({ source: "MENU" })
  }, [enabled, send])

  const trackItemView = useCallback(
    (menuItemId: string, source: "ITEM" | "AR" = "ITEM") => {
      const key = `${source}:${menuItemId}`
      if (trackedItems.current.has(key)) return
      trackedItems.current.add(key)
      send({ menuItemId, source })
    },
    [send]
  )

  return { trackItemView }
}
