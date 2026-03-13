"use client"

import "./globals.css"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { Toaster } from "sonner"
import { PwaInstallBanner } from "@/components/consumer/pwa-install-banner"
import { registerServiceWorker } from "@/lib/pwa"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      })
  )

  useEffect(() => {
    registerServiceWorker()
  }, [])

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#DC2626" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="OrderKaro" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
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
      </body>
    </html>
  )
}
