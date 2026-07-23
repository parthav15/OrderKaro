"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
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
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-line flex items-center justify-around py-2 px-4"
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        const Icon = item.icon
        return (
          <Link key={item.href} href={item.href} className="relative">
            <motion.div
              whileTap={{ scale: 0.92 }}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors",
                isActive ? "text-primary" : "text-muted"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="consumerNavActivePill"
                  className="absolute inset-0 rounded-xl bg-primary/10"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Icon className="relative w-5 h-5" />
              <span className="relative text-xs font-medium">{item.label}</span>
            </motion.div>
          </Link>
        )
      })}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={handleLogout}
        className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors text-muted hover:text-ink"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-xs font-medium">Logout</span>
      </motion.button>
    </motion.nav>
  )
}
