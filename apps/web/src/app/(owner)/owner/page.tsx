"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ShoppingBag,
  IndianRupee,
  Clock,
  TrendingUp,
  Banknote,
  CheckCircle2,
  Flame,
  PackageCheck,
  CircleCheck,
  X,
  ChevronDown,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { useAuthStore } from "@/stores/auth"
import api from "@/lib/api"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"

const statusConfig: Record<string, { label: string; dot: string; pill: string }> = {
  PLACED: {
    label: "New Order",
    dot: "bg-primary",
    pill: "bg-primary/10 text-primary border border-primary/20",
  },
  ACCEPTED: {
    label: "Accepted",
    dot: "bg-warning",
    pill: "bg-warning/10 text-warning border border-warning/30",
  },
  PREPARING: {
    label: "Preparing",
    dot: "bg-warning animate-pulse",
    pill: "bg-warning/10 text-warning border border-warning/30",
  },
  READY: {
    label: "Ready",
    dot: "bg-success",
    pill: "bg-success/10 text-success border border-success/30",
  },
}

const nextStatus: Record<string, string> = {
  PLACED: "ACCEPTED",
  ACCEPTED: "PREPARING",
  PREPARING: "READY",
}

const nextStatusConfig: Record<
  string,
  { label: string; icon: React.ElementType; className: string }
> = {
  PLACED: {
    label: "Accept Order",
    icon: CheckCircle2,
    className: "bg-success hover:opacity-90 text-white flex-1",
  },
  ACCEPTED: {
    label: "Start Preparing",
    icon: Flame,
    className: "bg-warning hover:opacity-90 text-white flex-1",
  },
  PREPARING: {
    label: "Mark Ready",
    icon: PackageCheck,
    className: "bg-success hover:opacity-90 text-white flex-1",
  },
}

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const [cashOrder, setCashOrder] = useState<any>(null)
  const [amountReceived, setAmountReceived] = useState("")
  const [cashResult, setCashResult] = useState<any>(null)

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      api.patch(`/api/v1/restaurants/${restaurantId}/orders/${orderId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-orders"] })
      toast.success("Order status updated")
    },
    onError: () => {
      toast.error("Failed to update order status")
    },
  })

  const collectCashMutation = useMutation({
    mutationFn: ({ orderId, amountReceived }: { orderId: string; amountReceived: number }) =>
      api.post(`/api/v1/restaurants/${restaurantId}/orders/${orderId}/collect-cash`, { amountReceived }),
    onSuccess: (res) => {
      setCashResult(res.data.data)
      queryClient.invalidateQueries({ queryKey: ["active-orders"] })
      queryClient.invalidateQueries({ queryKey: ["analytics-summary"] })
      toast.success("Payment collected successfully")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to collect payment")
    },
  })

  const { data: restaurants } = useQuery({
    queryKey: ["restaurants"],
    queryFn: () => api.get("/api/v1/restaurants").then((r) => r.data.data),
  })

  useEffect(() => {
    if (restaurants?.[0] && !restaurantId) {
      setRestaurantId(restaurants[0].id)
    }
  }, [restaurants, restaurantId])

  const { data: activeOrders } = useQuery({
    queryKey: ["active-orders", restaurantId],
    queryFn: () =>
      api.get(`/api/v1/restaurants/${restaurantId}/orders/active`).then((r) => r.data.data),
    enabled: !!restaurantId,
    refetchInterval: 5000,
  })

  const { data: summary } = useQuery({
    queryKey: ["analytics-summary", restaurantId],
    queryFn: () =>
      api.get(`/api/v1/restaurants/${restaurantId}/analytics/summary`).then((r) => r.data.data),
    enabled: !!restaurantId,
    refetchInterval: 30000,
  })

  function openCashModal(order: any) {
    setCashOrder(order)
    setAmountReceived(String(Number(order.totalAmount)))
    setCashResult(null)
  }

  function closeCashModal() {
    setCashOrder(null)
    setAmountReceived("")
    setCashResult(null)
  }

  function handleCollectCash() {
    if (!cashOrder) return
    const amount = parseFloat(amountReceived)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount")
      return
    }
    collectCashMutation.mutate({ orderId: cashOrder.id, amountReceived: amount })
  }

  const orderAmount = cashOrder ? Number(cashOrder.totalAmount) : 0
  const enteredAmount = parseFloat(amountReceived) || 0
  const changeAmount = Math.max(0, enteredAmount - orderAmount)

  const stats = [
    {
      label: "Active Orders",
      value: activeOrders?.length ?? 0,
      icon: ShoppingBag,
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
      valueSuffix: "",
    },
    {
      label: "Today's Revenue",
      value: formatPrice(summary?.todayRevenue ?? 0),
      icon: IndianRupee,
      iconColor: "text-ink",
      iconBg: "bg-surface-elevated",
      valueSuffix: "",
    },
    {
      label: "Avg Prep Time",
      value:
        summary?.avgPrepTimeMinutes ??
        restaurants?.find((c: any) => c.id === restaurantId)?.avgPrepTime ??
        15,
      icon: Clock,
      iconColor: "text-ink",
      iconBg: "bg-surface-elevated",
      valueSuffix: " min",
    },
    {
      label: "Today's Orders",
      value: summary?.todayOrders ?? 0,
      icon: TrendingUp,
      iconColor: "text-ink",
      iconBg: "bg-surface-elevated",
      valueSuffix: "",
    },
  ]

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight">
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-muted mt-1.5 text-base">
            Here&apos;s your restaurant at a glance
          </p>
        </div>

        {restaurants && restaurants.length > 1 && (
          <div className="relative">
            <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-1.5">
              Restaurant
            </label>
            <div className="relative">
              <select
                value={restaurantId || ""}
                onChange={(e) => setRestaurantId(e.target.value)}
                className="appearance-none pl-4 pr-10 py-3 rounded-xl border border-line text-base font-semibold text-ink focus:outline-none focus:border-primary bg-surface min-w-[180px] cursor-pointer"
              >
                {restaurants.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
              transition={{ delay: idx * 0.08, type: "spring", stiffness: 200, damping: 20 }}
            >
              <Card>
                <CardContent className="py-5 px-5">
                  <div
                    className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center mb-4`}
                  >
                    <Icon size={24} className={stat.iconColor} />
                  </div>
                  <p className="text-sm font-medium text-muted mb-1">{stat.label}</p>
                  <p className="text-3xl font-extrabold text-ink leading-none">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={String(stat.value)}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="inline-block"
                      >
                        {stat.value}
                      </motion.span>
                    </AnimatePresence>
                    {stat.valueSuffix && (
                      <span className="text-lg font-bold text-muted ml-1">
                        {stat.valueSuffix}
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div>
        <div className="flex items-center gap-3 mb-5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
          </span>
          <h2 className="text-xl font-extrabold text-ink">Live Orders</h2>
          {activeOrders && activeOrders.length > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-primary text-white text-xs font-bold">
              {activeOrders.length}
            </span>
          )}
        </div>

        <AnimatePresence mode="popLayout">
          {activeOrders && activeOrders.length > 0 ? (
            <div className="grid gap-4">
              {activeOrders.map((order: any, idx: number) => {
                const config = statusConfig[order.status]
                const actionConfig = nextStatusConfig[order.status]
                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ delay: idx * 0.04, type: "spring", stiffness: 240, damping: 24 }}
                  >
                    <Card>
                      <CardContent className="py-5 px-6">
                        <div className="flex items-start justify-between gap-4 mb-5">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2.5 flex-wrap mb-2">
                              <span className="text-lg font-extrabold text-ink">
                                Order #{order.orderNumber}
                              </span>
                              {config && (
                                <motion.span
                                  layout
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${config.pill}`}
                                >
                                  <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                                  {config.label}
                                </motion.span>
                              )}
                              {order.paymentMethod === "CASH" &&
                                order.paymentStatus !== "PAID" && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/30">
                                    <Banknote size={12} />
                                    CASH PENDING
                                  </span>
                                )}
                            </div>
                            <p className="text-sm text-muted font-medium">
                              {order.table?.label ? `${order.table.label} · ` : ""}
                              {order.items?.length} item{order.items?.length !== 1 ? "s" : ""}
                            </p>
                            <p className="text-sm text-muted mt-1 leading-relaxed">
                              {order.items
                                ?.slice(0, 3)
                                .map((i: any) => `${i.quantity}× ${i.menuItem?.name}`)
                                .join(", ")}
                              {order.items?.length > 3 &&
                                ` +${order.items.length - 3} more`}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-2xl font-extrabold text-ink leading-none">
                              {formatPrice(order.totalAmount)}
                            </p>
                            <Badge
                              variant={
                                order.paymentStatus === "PAID" ? "success" : "warning"
                              }
                              className="mt-2"
                            >
                              {order.paymentStatus}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex gap-2.5 flex-wrap">
                          {nextStatus[order.status] && actionConfig && (
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              whileHover={{ y: -1 }}
                              disabled={updateStatusMutation.isPending}
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  orderId: order.id,
                                  status: nextStatus[order.status],
                                })
                              }
                              className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:pointer-events-none shadow-sm ${actionConfig.className}`}
                            >
                              <actionConfig.icon size={18} />
                              {actionConfig.label}
                            </motion.button>
                          )}

                          {order.paymentMethod === "CASH" &&
                            order.paymentStatus !== "PAID" && (
                              <motion.button
                                whileTap={{ scale: 0.97 }}
                                whileHover={{ y: -1 }}
                                onClick={() => openCashModal(order)}
                                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border-2 border-ink text-ink hover:bg-surface-elevated transition-colors bg-surface"
                              >
                                <Banknote size={18} />
                                Collect Cash
                              </motion.button>
                            )}

                          {order.status === "PLACED" && (
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              whileHover={{ y: -1 }}
                              disabled={updateStatusMutation.isPending}
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  orderId: order.id,
                                  status: "CANCELLED",
                                })
                              }
                              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border border-primary text-primary hover:bg-primary/10 transition-colors bg-surface disabled:opacity-50 disabled:pointer-events-none"
                            >
                              <X size={16} />
                              Cancel
                            </motion.button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            activeOrders !== undefined && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-20 border-2 border-dashed border-line rounded-2xl"
              >
                <div className="w-20 h-20 rounded-2xl bg-surface-elevated flex items-center justify-center mx-auto mb-5">
                  <ShoppingBag size={36} className="text-muted" />
                </div>
                <p className="text-lg font-bold text-muted">
                  No active orders right now
                </p>
                <p className="text-sm text-muted mt-1">
                  New orders will appear here automatically
                </p>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>

      <Modal
        isOpen={!!cashOrder}
        onClose={closeCashModal}
        title={cashOrder ? `Collect Payment — Order #${cashOrder.orderNumber}` : ""}
      >
        {cashOrder && !cashResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="bg-surface-elevated rounded-xl p-5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted font-medium">Order Total</span>
                <span className="text-2xl font-extrabold text-ink">
                  {formatPrice(orderAmount)}
                </span>
              </div>
              <div className="text-xs text-muted leading-relaxed">
                {cashOrder.items
                  ?.map((i: any) => `${i.quantity}× ${i.menuItem?.name}`)
                  .join(", ")}
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-ink block mb-2.5">
                Amount Received from Customer
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-bold text-lg">
                  ₹
                </span>
                <input
                  type="number"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-line text-2xl font-extrabold text-ink focus:outline-none focus:border-primary"
                  min={orderAmount}
                  step="1"
                  autoFocus
                />
              </div>
            </div>

            {enteredAmount > orderAmount && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-primary/10 border border-primary/20 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Banknote size={16} className="text-primary" />
                  <span className="text-sm font-bold text-primary">Change to Return</span>
                </div>
                <p className="text-sm text-muted">
                  Hand back{" "}
                  <span className="font-bold text-ink">
                    {formatPrice(changeAmount)}
                  </span>{" "}
                  in cash to the customer
                </p>
              </motion.div>
            )}

            {enteredAmount > 0 && enteredAmount < orderAmount && (
              <p className="text-xs text-primary font-semibold">
                Amount must be at least {formatPrice(orderAmount)}
              </p>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={closeCashModal}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                loading={collectCashMutation.isPending}
                disabled={enteredAmount < orderAmount}
                onClick={handleCollectCash}
              >
                <Banknote size={18} />
                Confirm Payment
              </Button>
            </div>
          </motion.div>
        )}

        {cashResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-5"
          >
            <motion.div
              initial={{ scale: 0.6, rotate: -8 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto"
            >
              <CircleCheck size={32} className="text-success" />
            </motion.div>

            <div>
              <h3 className="text-lg font-extrabold text-ink">Payment Collected</h3>
              <p className="text-sm text-muted mt-1">
                Order #{cashResult.orderNumber} — {cashResult.consumerName}
              </p>
            </div>

            <div className="bg-surface-elevated rounded-xl p-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Order Amount</span>
                <span className="font-bold">{formatPrice(cashResult.orderAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Amount Received</span>
                <span className="font-bold">{formatPrice(cashResult.amountReceived)}</span>
              </div>
              {cashResult.changeAmount > 0 && (
                <div className="border-t border-line pt-2.5 flex justify-between">
                  <span className="text-muted">Change to Return</span>
                  <span className="font-bold text-primary">
                    {formatPrice(cashResult.changeAmount)}
                  </span>
                </div>
              )}
            </div>

            <Button className="w-full" size="lg" onClick={closeCashModal}>
              Done
            </Button>
          </motion.div>
        )}
      </Modal>
    </div>
  )
}
