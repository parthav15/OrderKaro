"use client"

import { useQuery } from "@tanstack/react-query"
import * as QRCode from "qrcode"

interface AnywhereQrPayload {
  url: string
  qrDataUrl: string
}

function resolveAppUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL
  if (configured) return configured.replace(/\/$/, "")
  if (typeof window !== "undefined") return window.location.origin
  return "http://localhost:3000"
}

export function useAnywhereQr(slug: string | null) {
  return useQuery<AnywhereQrPayload>({
    queryKey: ["anywhere-qr", slug],
    queryFn: async () => {
      const url = `${resolveAppUrl()}/${slug}/menu`
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 512,
        margin: 2,
        color: { dark: "#0A0A0A", light: "#FFFFFF" },
      })
      return { url, qrDataUrl }
    },
    enabled: !!slug,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })
}
