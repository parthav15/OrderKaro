"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/sidebar"
import { useAuthStore } from "@/stores/auth"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()

  useEffect(() => {
    if (!user || (user.role !== "OWNER" && user.role !== "MANAGER")) {
      router.replace("/login")
    }
  }, [user, router])

  if (!user || (user.role !== "OWNER" && user.role !== "MANAGER")) {
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      <main className="ml-64 p-8">{children}</main>
    </div>
  )
}
