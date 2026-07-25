"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  QrCode,
  Users,
  BarChart3,
  CreditCard,
  Banknote,
  Coins,
  Settings,
  Megaphone,
  ChevronDown,
  LogOut,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/ui/logo"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useAuthStore } from "@/stores/auth"

type NavLeaf = { href: string; label: string; icon: typeof LayoutDashboard }
type NavEntry =
  | { kind: "link"; href: string; label: string; icon: typeof LayoutDashboard }
  | { kind: "group"; label: string; icon: typeof LayoutDashboard; items: NavLeaf[] }

const NAV: NavEntry[] = [
  { kind: "link", href: "/owner", label: "Dashboard", icon: LayoutDashboard },
  {
    kind: "group",
    label: "Operations",
    icon: ShoppingBag,
    items: [
      { href: "/owner/orders", label: "Orders", icon: ShoppingBag },
      { href: "/owner/menu", label: "Menu", icon: UtensilsCrossed },
      { href: "/owner/tables", label: "Tables", icon: QrCode },
    ],
  },
  {
    kind: "group",
    label: "Finance",
    icon: Coins,
    items: [
      { href: "/owner/payments", label: "Payments", icon: Banknote },
      { href: "/owner/billing", label: "Billing", icon: CreditCard },
      { href: "/owner/fees", label: "Fees", icon: Coins },
    ],
  },
  {
    kind: "group",
    label: "Workspace",
    icon: Settings,
    items: [
      { href: "/owner/staff", label: "Staff", icon: Users },
      { href: "/owner/announcements", label: "Announcements", icon: Megaphone },
      { href: "/owner/settings", label: "Settings", icon: Settings },
    ],
  },
  { kind: "link", href: "/owner/analytics", label: "Analytics", icon: BarChart3 },
]

export function AdminTopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const navRef = useRef<HTMLDivElement>(null)

  const linkActive = (href: string) =>
    href === "/owner" ? pathname === "/owner" : pathname.startsWith(href)
  const groupActive = (items: NavLeaf[]) => items.some((i) => pathname.startsWith(i.href))

  useEffect(() => {
    setOpenGroup(null)
  }, [pathname])

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) setOpenGroup(null)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenGroup(null)
    }
    document.addEventListener("mousedown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const userInitial = user?.name?.charAt(0)?.toUpperCase() ?? "?"

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-6 pt-4 pointer-events-none">
      <div className="flex items-center justify-between max-w-[1400px] mx-auto gap-5">
        <Link href="/owner" className="pointer-events-auto shrink-0">
          <motion.span
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Logo size="sm" />
          </motion.span>
        </Link>

        <motion.nav
          ref={navRef}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.05 }}
          className="pointer-events-auto bg-surface/80 backdrop-blur-xl border border-line/60 shadow-lg shadow-black/[0.04] rounded-2xl px-2 py-1.5 flex items-center gap-0.5"
        >
          {NAV.map((entry) => {
            if (entry.kind === "link") {
              const active = linkActive(entry.href)
              const Icon = entry.icon
              return (
                <Link key={entry.href} href={entry.href}>
                  <motion.div
                    whileHover={{ scale: active ? 1 : 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="relative"
                  >
                    {active && (
                      <motion.div
                        layoutId="ownerNavPill"
                        className="absolute inset-0 bg-primary rounded-xl shadow-sm"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <div
                      className={cn(
                        "relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition-colors duration-150 whitespace-nowrap",
                        active ? "text-white" : "text-muted hover:text-ink"
                      )}
                    >
                      <Icon size={14} className="shrink-0" />
                      {entry.label}
                    </div>
                  </motion.div>
                </Link>
              )
            }

            const active = groupActive(entry.items)
            const open = openGroup === entry.label
            const Icon = entry.icon
            return (
              <div
                key={entry.label}
                className="relative"
                onMouseEnter={() => setOpenGroup(entry.label)}
                onMouseLeave={() => setOpenGroup(null)}
              >
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setOpenGroup(open ? null : entry.label)}
                  className="relative"
                >
                  {active && (
                    <motion.div
                      layoutId="ownerNavPill"
                      className="absolute inset-0 bg-primary rounded-xl shadow-sm"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <div
                    className={cn(
                      "relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition-colors duration-150 whitespace-nowrap",
                      active
                        ? "text-white"
                        : open
                        ? "text-ink bg-ink/[0.04]"
                        : "text-muted hover:text-ink"
                    )}
                  >
                    <Icon size={14} className="shrink-0" />
                    {entry.label}
                    <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={13} className="shrink-0 opacity-70" />
                    </motion.span>
                  </div>
                </motion.button>

                <AnimatePresence>
                  {open && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 420, damping: 30 }}
                      className="absolute left-1/2 top-full -translate-x-1/2 pt-2.5"
                    >
                      <div className="min-w-[210px] bg-surface/95 backdrop-blur-xl border border-line/60 shadow-xl shadow-black/[0.08] rounded-2xl p-1.5">
                        {entry.items.map((item, index) => {
                          const itemActive = pathname.startsWith(item.href)
                          const ItemIcon = item.icon
                          return (
                            <motion.div
                              key={item.href}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.03 + index * 0.04, duration: 0.2 }}
                            >
                              <Link
                                href={item.href}
                                onClick={() => setOpenGroup(null)}
                                className={cn(
                                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors duration-150",
                                  itemActive
                                    ? "bg-primary text-white"
                                    : "text-muted hover:text-ink hover:bg-ink/[0.04]"
                                )}
                              >
                                <ItemIcon
                                  size={15}
                                  className={cn("shrink-0", itemActive ? "text-white" : "text-accent")}
                                />
                                {item.label}
                              </Link>
                            </motion.div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </motion.nav>

        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
          className="pointer-events-auto shrink-0 flex items-center gap-2.5"
        >
          <ThemeToggle className="shadow-lg shadow-black/[0.04]" />

          <div className="flex items-center gap-2.5 bg-surface/80 backdrop-blur-xl border border-line/60 rounded-xl px-3 py-1.5 shadow-lg shadow-black/[0.04]">
            <div className="w-7 h-7 rounded-lg bg-ink flex items-center justify-center shrink-0">
              <span className="text-canvas text-xs font-bold leading-none">{userInitial}</span>
            </div>
            <span className="text-sm font-semibold text-ink max-w-[100px] truncate hidden md:block">
              {user?.name}
            </span>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-muted hover:bg-primary/10 hover:text-primary transition-colors duration-150"
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
