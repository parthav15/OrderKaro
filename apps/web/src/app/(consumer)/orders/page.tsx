"use client"

import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  LogOut,
  QrCode,
  ChevronRight,
  Receipt,
  Utensils,
  ShoppingBag,
  Bike,
} from "lucide-react"
import { toast } from "sonner"
import { Logo } from "@/components/ui/logo"
import { useAuthStore } from "@/stores/auth"
import api from "@/lib/api"
import { cn, formatPrice } from "@/lib/utils"

interface ConsumerOrder {
  id: string
  orderNumber: number
  status: string
  orderType?: string
  totalAmount: string
  placedAt: string
  table?: { label: string } | null
  items: { quantity: number; menuItem: { name: string } }[]
  restaurant: { name: string; slug: string }
}

const STATUS_META: Record<string, { label: string; className: string; dot: string }> = {
  AWAITING_PAYMENT: { label: "Payment pending", className: "bg-warning/10 text-warning", dot: "bg-warning" },
  PLACED: { label: "Placed", className: "bg-primary/10 text-primary", dot: "bg-primary" },
  ACCEPTED: { label: "Accepted", className: "bg-primary/10 text-primary", dot: "bg-primary" },
  PREPARING: { label: "Preparing", className: "bg-warning/10 text-warning", dot: "bg-warning" },
  READY: { label: "Ready", className: "bg-success/10 text-success", dot: "bg-success" },
  PICKED_UP: { label: "Completed", className: "bg-success/10 text-success", dot: "bg-success" },
  CANCELLED: { label: "Cancelled", className: "bg-danger/10 text-danger", dot: "bg-danger" },
}

const TYPE_ICON: Record<string, typeof Utensils> = {
  DINE_IN: Utensils,
  TAKEAWAY: ShoppingBag,
  DELIVERY: Bike,
}

function formatWhen(iso: string): string {
  const d = new Date(iso)
  return (
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) +
    " · " +
    d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
  )
}

export default function OrdersPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const isConsumer = user?.role === "CONSUMER"

  const { data, isLoading } = useQuery<ConsumerOrder[]>({
    queryKey: ["consumer-orders", user?.id],
    queryFn: () => api.get("/api/v1/consumer/orders").then((r) => r.data.data),
    enabled: isConsumer,
  })

  function handleLogout() {
    logout()
    toast.success("Signed out")
  }

  if (!isConsumer) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-20 h-20 rounded-full bg-surface-elevated flex items-center justify-center mb-5"
        >
          <QrCode className="w-10 h-10 text-muted" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center"
        >
          <Logo size="lg" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="text-muted mt-3 text-sm leading-relaxed max-w-xs"
        >
          Scan the QR code at your table to browse the menu and place an order.
        </motion.p>
      </div>
    )
  }

  const orders = data ?? []

  return (
    <div className="min-h-screen bg-canvas pb-16">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-30 bg-surface/85 backdrop-blur-xl border-b border-line/60"
      >
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.back()}
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-ink hover:bg-ink/[0.05] transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <h1 className="font-heading text-lg font-extrabold text-ink tracking-tight">Your orders</h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleLogout}
            className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-ink/[0.04] text-muted hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline text-sm font-semibold">Sign out</span>
          </motion.button>
        </div>
      </motion.header>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center gap-2.5 mb-5"
        >
          <div className="w-9 h-9 rounded-xl bg-ink flex items-center justify-center shrink-0">
            <span className="text-canvas text-sm font-bold leading-none">
              {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink truncate">{user?.name}</p>
            {user?.phone && <p className="text-xs text-muted">+91 {user.phone}</p>}
          </div>
        </motion.div>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-surface-elevated animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center text-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-surface-elevated flex items-center justify-center mb-5">
              <Receipt className="w-9 h-9 text-muted" />
            </div>
            <h2 className="text-lg font-bold text-ink">No orders yet</h2>
            <p className="text-sm text-muted mt-1.5 max-w-xs">
              When you place an order, it will show up here so you can track it.
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
            className="space-y-3"
          >
            {orders.map((order) => {
              const meta = STATUS_META[order.status] ?? STATUS_META.PLACED
              const TypeIcon = TYPE_ICON[order.orderType ?? "TAKEAWAY"] ?? ShoppingBag
              const summary = order.items
                .slice(0, 3)
                .map((i) => `${i.quantity}× ${i.menuItem.name}`)
                .join(", ")
              const extra = order.items.length - 3
              return (
                <motion.button
                  key={order.id}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
                  }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => router.push(`/${order.restaurant.slug}/order/${order.id}`)}
                  className="w-full text-left bg-surface border border-line rounded-2xl p-4 flex flex-col gap-3 transition-shadow hover:shadow-lg hover:shadow-black/[0.04]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-heading text-base font-extrabold text-ink truncate">
                        {order.restaurant.name}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        Order #{order.orderNumber} · {formatWhen(order.placedAt)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold",
                        meta.className
                      )}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full", meta.dot)} />
                      {meta.label}
                    </span>
                  </div>

                  <p className="text-sm text-muted line-clamp-1">
                    {summary}
                    {extra > 0 && ` +${extra} more`}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-line/70">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
                      <TypeIcon className="w-3.5 h-3.5" />
                      {order.table?.label ?? (order.orderType === "DELIVERY" ? "Delivery" : "Takeaway")}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="text-base font-extrabold text-ink">
                        {formatPrice(Number(order.totalAmount))}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted" />
                    </span>
                  </div>
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </div>
    </div>
  )
}
