"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ShoppingBag, DollarSign, Clock, TrendingUp, Banknote, Wallet, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { useAuthStore } from "@/stores/auth"
import api from "@/lib/api"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"

const statusColors: Record<string, string> = {
  PLACED: "bg-neutral-100 text-brand-black",
  ACCEPTED: "bg-neutral-100 text-brand-black",
  PREPARING: "bg-brand-black text-white",
  READY: "bg-brand-red text-white",
}

const nextStatus: Record<string, string> = {
  PLACED: "ACCEPTED",
  ACCEPTED: "PREPARING",
  PREPARING: "READY",
  READY: "PICKED_UP",
}

const nextStatusLabel: Record<string, string> = {
  PLACED: "Accept",
  ACCEPTED: "Start Preparing",
  PREPARING: "Mark Ready",
  READY: "Picked Up",
}

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user)
  const [canteenId, setCanteenId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const [cashOrder, setCashOrder] = useState<any>(null)
  const [amountReceived, setAmountReceived] = useState("")
  const [cashResult, setCashResult] = useState<any>(null)

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      api.patch(`/api/v1/canteens/${canteenId}/orders/${orderId}/status`, { status }),
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
      api.post(`/api/v1/canteens/${canteenId}/orders/${orderId}/collect-cash`, { amountReceived }),
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

  const { data: canteens } = useQuery({
    queryKey: ["canteens"],
    queryFn: () => api.get("/api/v1/canteens").then((r) => r.data.data),
  })

  useEffect(() => {
    if (canteens?.[0] && !canteenId) {
      setCanteenId(canteens[0].id)
    }
  }, [canteens, canteenId])

  const { data: activeOrders } = useQuery({
    queryKey: ["active-orders", canteenId],
    queryFn: () =>
      api.get(`/api/v1/canteens/${canteenId}/orders/active`).then((r) => r.data.data),
    enabled: !!canteenId,
    refetchInterval: 5000,
  })

  const { data: summary } = useQuery({
    queryKey: ["analytics-summary", canteenId],
    queryFn: () =>
      api.get(`/api/v1/canteens/${canteenId}/analytics/summary`).then((r) => r.data.data),
    enabled: !!canteenId,
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
      color: "text-brand-red",
      bg: "bg-red-50",
    },
    {
      label: "Today's Revenue",
      value: formatPrice(summary?.todayRevenue ?? 0),
      icon: DollarSign,
      color: "text-brand-black",
      bg: "bg-neutral-100",
    },
    {
      label: "Avg Prep Time",
      value: `${summary?.avgPrepTimeMinutes ?? canteens?.find((c: any) => c.id === canteenId)?.avgPrepTime ?? 15} min`,
      icon: Clock,
      color: "text-brand-black",
      bg: "bg-neutral-100",
    },
    {
      label: "Today's Orders",
      value: summary?.todayOrders ?? 0,
      icon: TrendingUp,
      color: "text-brand-black",
      bg: "bg-neutral-100",
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-brand-black">
          Welcome back, {user?.name}
        </h1>
        <p className="text-neutral-500 mt-1">Here&apos;s your canteen overview</p>
      </div>

      {canteens && canteens.length > 1 && (
        <div className="mb-6">
          <select
            value={canteenId || ""}
            onChange={(e) => setCanteenId(e.target.value)}
            className="px-4 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-brand-red"
          >
            {canteens.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card>
                <CardContent className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">{stat.label}</p>
                    <p className="text-2xl font-extrabold text-brand-black">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {activeOrders && activeOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-brand-black mb-4">Live Orders</h2>
          <div className="grid gap-3">
            {activeOrders.map((order: any, idx: number) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card>
                  <CardContent>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold">Order #{order.orderNumber}</p>
                          {order.paymentMethod === "CASH" && order.paymentStatus !== "PAID" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-brand-red border border-brand-red/20">
                              CASH PENDING
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-500">
                          {order.table?.label ? `${order.table.label} · ` : ""}{order.items?.length} items
                        </p>
                        <div className="text-xs text-neutral-400 mt-1">
                          {order.items?.slice(0, 2).map((i: any) => `${i.quantity}× ${i.menuItem?.name}`).join(", ")}
                          {order.items?.length > 2 && ` +${order.items.length - 2} more`}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          statusColors[order.status] || "bg-neutral-100 text-neutral-700"
                        }`}>
                          {order.status}
                        </span>
                        <p className="text-sm font-bold mt-1">{formatPrice(order.totalAmount)}</p>
                        <Badge
                          variant={order.paymentStatus === "PAID" ? "success" : "warning"}
                          className="mt-1"
                        >
                          {order.paymentStatus}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {nextStatus[order.status] && (
                        <Button
                          className="flex-1"
                          variant={order.status === "READY" ? "secondary" : "primary"}
                          size="sm"
                          loading={updateStatusMutation.isPending}
                          onClick={() =>
                            updateStatusMutation.mutate({
                              orderId: order.id,
                              status: nextStatus[order.status],
                            })
                          }
                        >
                          {nextStatusLabel[order.status]}
                        </Button>
                      )}

                      {order.paymentMethod === "CASH" && order.paymentStatus !== "PAID" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-brand-black"
                          onClick={() => openCashModal(order)}
                        >
                          <Banknote className="w-4 h-4" />
                          Collect Cash
                        </Button>
                      )}

                      {order.status === "PLACED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-brand-red border-brand-red hover:bg-red-50"
                          loading={updateStatusMutation.isPending}
                          onClick={() =>
                            updateStatusMutation.mutate({
                              orderId: order.id,
                              status: "CANCELLED",
                            })
                          }
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {activeOrders && activeOrders.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 border border-dashed border-neutral-200 rounded-2xl"
        >
          <ShoppingBag className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
          <p className="text-neutral-400 font-medium">No active orders right now</p>
        </motion.div>
      )}

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
            <div className="bg-neutral-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Order Total</span>
                <span className="text-xl font-extrabold text-brand-black">{formatPrice(orderAmount)}</span>
              </div>
              <div className="text-xs text-neutral-400">
                {cashOrder.items?.map((i: any) => `${i.quantity}× ${i.menuItem?.name}`).join(", ")}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-brand-black block mb-2">
                Amount Received from Student
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">₹</span>
                <input
                  type="number"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 text-2xl font-extrabold text-brand-black focus:outline-none focus:border-brand-red"
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
                className="bg-red-50 border border-brand-red/20 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-4 h-4 text-brand-red" />
                  <span className="text-sm font-semibold text-brand-red">Wallet Credit</span>
                </div>
                <p className="text-sm text-neutral-600">
                  <span className="font-bold text-brand-black">{formatPrice(changeAmount)}</span> will be added to the student&apos;s wallet
                </p>
              </motion.div>
            )}

            {enteredAmount > 0 && enteredAmount < orderAmount && (
              <p className="text-xs text-brand-red font-medium">
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
                <Banknote className="w-4 h-4" />
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
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <Banknote className="w-8 h-8 text-brand-red" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-brand-black">Payment Collected</h3>
              <p className="text-sm text-neutral-500 mt-1">
                Order #{cashResult.orderNumber} — {cashResult.consumerName}
              </p>
            </div>

            <div className="bg-neutral-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Order Amount</span>
                <span className="font-bold">{formatPrice(cashResult.orderAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Amount Received</span>
                <span className="font-bold">{formatPrice(cashResult.amountReceived)}</span>
              </div>
              {cashResult.changeAmount > 0 && (
                <>
                  <div className="border-t border-neutral-200 pt-2 flex justify-between">
                    <span className="text-neutral-500">Change → Wallet</span>
                    <span className="font-bold text-brand-red">{formatPrice(cashResult.changeAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">New Wallet Balance</span>
                    <span className="font-bold">{formatPrice(cashResult.newWalletBalance)}</span>
                  </div>
                </>
              )}
            </div>

            <Button className="w-full" onClick={closeCashModal}>
              Done
            </Button>
          </motion.div>
        )}
      </Modal>
    </div>
  )
}
