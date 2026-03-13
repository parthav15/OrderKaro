"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const DISMISSED_KEY = "orderkaro-pwa-install-dismissed"

export function PwaInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const dismissed = localStorage.getItem(DISMISSED_KEY)
    if (dismissed) return

    const hasPlacedOrder = localStorage.getItem("orderkaro-has-placed-order")

    let captured: BeforeInstallPromptEvent | null = null

    const handler = (e: Event) => {
      e.preventDefault()
      captured = e as BeforeInstallPromptEvent
      setInstallPrompt(captured)
      if (hasPlacedOrder) {
        setVisible(true)
      }
    }

    window.addEventListener("beforeinstallprompt", handler)

    const storageHandler = (e: StorageEvent) => {
      if (e.key === "orderkaro-has-placed-order" && e.newValue && captured) {
        setVisible(true)
      }
    }

    window.addEventListener("storage", storageHandler)

    if (hasPlacedOrder && captured) {
      setVisible(true)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      window.removeEventListener("storage", storageHandler)
    }
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === "accepted") {
      setVisible(false)
      setInstallPrompt(null)
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "true")
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed bottom-20 inset-x-4 z-50"
        >
          <div className="bg-brand-black rounded-2xl p-4 flex items-center gap-3 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-brand-red flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">Add to Home Screen</p>
              <p className="text-neutral-400 text-xs mt-0.5">
                Get quick access to your canteen
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="primary"
                onClick={handleInstall}
                className="text-xs px-3 py-1.5"
              >
                Install
              </Button>
              <button
                onClick={handleDismiss}
                className="p-1 text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
