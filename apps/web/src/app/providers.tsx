"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { Toaster } from "sonner"
import { PwaInstallBanner } from "@/components/consumer/pwa-install-banner"
import { registerServiceWorker } from "@/lib/pwa"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      })
  )

  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      registerServiceWorker()
      return
    }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <PwaInstallBanner />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#0A0A0A",
            color: "#FFFFFF",
            border: "none",
          },
        }}
      />
    </QueryClientProvider>
  )
}
