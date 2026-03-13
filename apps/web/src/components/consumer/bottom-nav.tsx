"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { ShoppingBag, Wallet, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth"

const navItems = [
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/wallet", label: "Wallet", icon: Wallet },
]

export function ConsumerBottomNav() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const router = useRouter()

  if (!user || user.role !== "CONSUMER") return null

  function handleLogout() {
    logout()
    router.push("/login")
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-neutral-100 flex items-center justify-around py-2 px-4">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors",
              isActive ? "text-brand-red" : "text-neutral-400"
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        )
      })}
      <button
        onClick={handleLogout}
        className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors text-neutral-400 hover:text-brand-black"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-xs font-medium">Logout</span>
      </button>
    </nav>
  )
}
