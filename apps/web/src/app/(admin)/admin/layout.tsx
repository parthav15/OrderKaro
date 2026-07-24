"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ShieldAlert } from "lucide-react"
import { PlatformTopNav } from "@/components/admin/platform-top-nav"
import { useAuthStore } from "@/stores/auth"
import { BrandLoader } from "@/components/ui/brand-loader"
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe"

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const [hydrated, setHydrated] = useState(false)
  const reduceMotion = useReducedMotionSafe()

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true)
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true))
      return () => unsub()
    }
  }, [])

  if (!hydrated) {
    return <BrandLoader />
  }

  return (
    <div className="min-h-screen bg-canvas">
      <PlatformTopNav />
      <main className="mx-auto max-w-[1400px] px-6 pb-16 pt-10">
        {user?.isSuperAdmin ? (
          children
        ) : (
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <ShieldAlert className="h-8 w-8 text-brand-red" />
            </div>
            <h2 className="text-xl font-bold text-ink">Access Denied</h2>
            <p className="mt-2 max-w-sm text-sm text-muted">
              This area is restricted to the super admin only.
            </p>
          </motion.div>
        )}
      </main>
    </div>
  )
}
