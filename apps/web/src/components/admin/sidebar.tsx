"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  UtensilsCrossed,
  QrCode,
  ShoppingBag,
  Users,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  Store,
  Megaphone,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth"
import { useRouter } from "next/navigation"

const SUPER_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "admin@orderkaro.com"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/canteens", label: "Canteens", icon: Store },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/tables", label: "Tables & QR", icon: QrCode },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/staff", label: "Staff", icon: Users },
  { href: "/admin/wallet", label: "Wallet", icon: Wallet },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const router = useRouter()

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-neutral-100 flex flex-col z-40">
      <div className="px-6 py-6 border-b border-neutral-100">
        <h1 className="text-xl font-extrabold text-brand-black">
          Order<span className="text-brand-red">Karo</span>
        </h1>
        <p className="text-xs text-neutral-400 mt-1">Admin Panel</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-red text-white"
                  : "text-neutral-600 hover:bg-neutral-50"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}

        {isSuperAdmin && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                System
              </p>
            </div>
            <Link
              href="/admin/super"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                pathname.startsWith("/admin/super")
                  ? "bg-brand-red text-white"
                  : "text-neutral-600 hover:bg-neutral-50"
              )}
            >
              <Shield className="w-4 h-4" />
              Super Admin
            </Link>
          </>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-neutral-100">
        <button
          onClick={() => {
            logout()
            router.push("/login")
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-50 w-full"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
