"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  QrCode,
  Users,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  Store,
  Shield,
} from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth"

const SUPER_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "admin@orderkaro.com"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/tables", label: "Tables", icon: QrCode },
  { href: "/admin/staff", label: "Staff", icon: Users },
  { href: "/admin/wallet", label: "Wallet", icon: Wallet },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

const superAdminItems = [
  { href: "/admin/canteens", label: "Canteens", icon: Store },
  { href: "/admin/super", label: "Super Admin", icon: Shield },
]

export function AdminTopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  const allItems = isSuperAdmin ? [...navItems, ...superAdminItems] : navItems

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const userInitial = user?.name?.charAt(0)?.toUpperCase() ?? "?"

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-6 pt-4 pointer-events-none">
      <div className="flex items-center justify-between max-w-[1400px] mx-auto gap-5">
        <Link href="/admin" className="pointer-events-auto shrink-0">
          <motion.span
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="text-xl font-extrabold text-[#0A0A0A] tracking-tight select-none"
          >
            Order<span className="text-[#DC2626]">Karo</span>
          </motion.span>
        </Link>

        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.05 }}
          className="pointer-events-auto bg-white/80 backdrop-blur-xl border border-neutral-200/60 shadow-lg shadow-black/[0.04] rounded-2xl px-2 py-1.5 flex items-center gap-0.5 overflow-x-auto scrollbar-hide"
        >
          {allItems.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ scale: active ? 1 : 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="relative"
                >
                  {active && (
                    <motion.div
                      layoutId="activeNavPill"
                      className="absolute inset-0 bg-[#DC2626] rounded-xl shadow-sm"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 32,
                      }}
                    />
                  )}
                  <div
                    className={cn(
                      "relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition-colors duration-150 whitespace-nowrap",
                      active
                        ? "text-white"
                        : "text-neutral-500 hover:text-[#0A0A0A]"
                    )}
                  >
                    <Icon
                      size={14}
                      className={cn(
                        "shrink-0",
                        active ? "text-white" : "text-neutral-400"
                      )}
                    />
                    {item.label}
                  </div>
                </motion.div>
              </Link>
            )
          })}
        </motion.nav>

        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
          className="pointer-events-auto shrink-0 flex items-center gap-2.5"
        >
          <div className="flex items-center gap-2.5 bg-white/80 backdrop-blur-xl border border-neutral-200/60 rounded-xl px-3 py-1.5 shadow-lg shadow-black/[0.04]">
            <div className="w-7 h-7 rounded-lg bg-[#0A0A0A] flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold leading-none">
                {userInitial}
              </span>
            </div>
            <span className="text-sm font-semibold text-[#0A0A0A] max-w-[100px] truncate hidden md:block">
              {user?.name}
            </span>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-neutral-400 hover:bg-red-50 hover:text-[#DC2626] transition-colors duration-150"
              title="Logout"
            >
              <LogOut size={15} />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
