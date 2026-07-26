"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { LayoutGrid, Store, Coins, Boxes, MessageSquareText, LogOut, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/ui/logo"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useAuthStore } from "@/stores/auth"
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe"

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutGrid },
  { href: "/admin/restaurants", label: "Restaurants", icon: Store },
  { href: "/admin/fees", label: "Fees", icon: Coins },
  { href: "/admin/sms", label: "SMS", icon: MessageSquareText },
  { href: "/admin/model-requests", label: "AR Models", icon: Boxes },
]

export function PlatformTopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const reduceMotion = useReducedMotionSafe()

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const userInitial = user?.name?.charAt(0)?.toUpperCase() ?? "?"

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-surface/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-6">
        <motion.div
          initial={{ opacity: 0, x: reduceMotion ? 0 : -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex shrink-0 items-center gap-3"
        >
          <Link href="/admin" className="flex items-center">
            <Logo size="sm" />
          </Link>
          <span className="hidden items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-accent sm:inline-flex">
            <ShieldCheck size={12} className="shrink-0" />
            Platform
          </span>
        </motion.div>

        <motion.nav
          initial={{ opacity: 0, y: reduceMotion ? 0 : -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduceMotion ? 0.01 : 0.5,
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: reduceMotion ? 0 : 0.05,
          }}
          className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-2xl border border-line/60 bg-canvas/60 px-1.5 py-1.5 scrollbar-hide"
        >
          {navItems.map((item, i) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  initial={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reduceMotion ? 0.01 : 0.35,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    delay: reduceMotion ? 0 : 0.14 + i * 0.07,
                  }}
                  whileHover={{ scale: active || reduceMotion ? 1 : 1.04 }}
                  whileTap={{ scale: reduceMotion ? 1 : 0.96 }}
                  className="relative"
                >
                  {active && (
                    <motion.div
                      layoutId="platformNavPill"
                      className="absolute inset-0 rounded-xl bg-ink shadow-sm"
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 380, damping: 32 }
                      }
                    />
                  )}
                  <div
                    className={cn(
                      "relative flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-colors duration-150",
                      active ? "text-canvas" : "text-muted hover:text-ink"
                    )}
                  >
                    <Icon size={14} className="shrink-0" />
                    {item.label}
                  </div>
                </motion.div>
              </Link>
            )
          })}
        </motion.nav>

        <motion.div
          initial={{ opacity: 0, x: reduceMotion ? 0 : 14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: reduceMotion ? 0.01 : 0.45,
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: reduceMotion ? 0 : 0.1,
          }}
          className="flex shrink-0 items-center gap-2.5"
        >
          <ThemeToggle />
          <div className="flex items-center gap-2.5 rounded-xl border border-line/70 bg-canvas/60 px-3 py-1.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink ring-2 ring-accent/40">
              <span className="text-[11px] font-bold leading-none text-canvas">
                {userInitial}
              </span>
            </div>
            <span className="hidden max-w-[110px] truncate text-sm font-semibold text-ink md:block">
              {user?.name}
            </span>
            <motion.button
              whileHover={{ scale: reduceMotion ? 1 : 1.08 }}
              whileTap={{ scale: reduceMotion ? 1 : 0.92 }}
              onClick={handleLogout}
              className="rounded-lg p-1.5 text-muted transition-colors duration-150 hover:bg-primary/10 hover:text-primary"
              title="Logout"
            >
              <LogOut size={15} />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </header>
  )
}
