"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminTopNav } from "@/components/admin/top-nav"
import { useAuthStore } from "@/stores/auth"
import { BrandLoader } from "@/components/ui/brand-loader"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true)
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true))
      return () => unsub()
    }
  }, [])

  useEffect(() => {
    if (hydrated && (!user || (user.role !== "OWNER" && user.role !== "MANAGER"))) {
      router.replace("/login")
    }
  }, [user, hydrated, router])

  if (!hydrated || !user || (user.role !== "OWNER" && user.role !== "MANAGER")) {
    return <BrandLoader />
  }

  return (
    <div className="min-h-screen bg-canvas">
      <AdminTopNav />
      <main className="pt-20 px-8 pb-8 max-w-[1400px] mx-auto">{children}</main>
    </div>
  )
}
