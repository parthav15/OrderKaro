"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, X, Banknote, Wallet, ClipboardList, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import api from "@/lib/api"
import { formatPrice, formatTime } from "@/lib/utils"
import { toast } from "sonner"

interface OrderItem {
  id: string
  quantity: number
  unitPrice: string
  totalPrice: string
  menuItem: { name: string }
  selectedOptions?: Array<{
    customizationName: string
    optionNames: string[]
  }>
}

interface Order {
  id: string
  orderNumber: number
  status: string
  paymentMethod: string
  paymentStatus: string
  totalAmount: string
  specialInstructions: string | null
  placedAt: string
  table?: { label: string }
  items: OrderItem[]
}

interface OrdersResponse {
  orders: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const statusColors: Record<string, string> = {
  PLACED: "bg-neutral-100 text-brand-black",
  ACCEPTED: "bg-neutral-100 text-brand-black",
  PREPARING: "bg-brand-black text-white",
  READY: "bg-brand-black text-white",
  PICKED_UP: "bg-neutral-100 text-neutral-500",
  CANCELLED: "bg-brand-red/10 text-brand-red",
}

const statusLabels: Record<string, string> = {
  PLACED: "Order Placed",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY: "Ready",
  PICKED_UP: "Picked Up",
  CANCELLED: "Cancelled",
}

const ALL_STATUSES = ["PLACED", "ACCEPTED", "PREPARING", "READY", "PICKED_UP", "CANCELLED"]
const PAYMENT_METHODS = ["WALLET", "CASH", "CARD"]
const ACTIVE_STATUSES = new Set(["PLACED", "ACCEPTED", "PREPARING", "READY"])

const nextStatus: Record<string, string> = {
  PLACED: "ACCEPTED",
  ACCEPTED: "PREPARING",
  PREPARING: "READY",
  READY: "PICKED_UP",
}

const nextStatusLabel: Record<string, string> = {
  PLACED: "Accept Order",
  ACCEPTED: "Start Preparing",
  PREPARING: "Mark as Ready",
  READY: "Mark as Picked Up",
}

export default function OrderHistory() {
  const [canteenId, setCanteenId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [cashOrder, setCashOrder] = useState<Order | null>(null)
  const [amountReceived, setAmountReceived] = useState("")
  const [cashResult, setCashResult] = useState<any>(null)
  const queryClient = useQueryClient()

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      api.patch(`/api/v1/canteens/${canteenId}/orders/${orderId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders-history"] })
      setSelectedOrder(null)
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
      queryClient.invalidateQueries({ queryKey: ["orders-history"] })
      toast.success("Payment collected")
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

  const queryParams = new URLSearchParams()
  queryParams.set("page", String(page))
  queryParams.set("limit", "20")
  if (statusFilter) queryParams.set("status", statusFilter)
  if (paymentFilter) queryParams.set("paymentMethod", paymentFilter)
  if (dateFrom) queryParams.set("dateFrom", dateFrom)
  if (dateTo) queryParams.set("dateTo", dateTo)

  const { data: ordersData, isLoading } = useQuery<OrdersResponse>({
    queryKey: ["orders-history", canteenId, page, statusFilter, paymentFilter, dateFrom, dateTo],
    queryFn: () =>
      api
        .get(`/api/v1/canteens/${canteenId}/orders/history?${queryParams.toString()}`)
        .then((r) => r.data.data),
    enabled: !!canteenId,
  })

  function clearFilters() {
    setStatusFilter("")
    setPaymentFilter("")
    setDateFrom("")
    setDateTo("")
    setPage(1)
    setShowFilters(false)
  }

  const hasActiveFilters = !!statusFilter || !!paymentFilter || !!dateFrom || !!dateTo

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-brand-red" />
            </div>
            <h1 className="text-3xl font-extrabold text-brand-black">Order History</h1>
          </div>
          <p className="text-neutral-500">
            {ordersData?.pagination?.total
              ? `${ordersData.pagination.total} total orders found`
              : "Browse and manage all canteen orders"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canteens && canteens.length > 1 && (
            <select
              value={canteenId || ""}
              onChange={(e) => { setCanteenId(e.target.value); setPage(1) }}
              className="px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-brand-red"
            >
              {canteens.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          <Button
            size="lg"
            variant={hasActiveFilters ? "primary" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-5 h-5" />
            {hasActiveFilters ? "Filters Active" : "Filter Orders"}
            {hasActiveFilters && (
              <span className="w-5 h-5 rounded-full bg-white text-brand-red text-xs font-bold flex items-center justify-center">
                !
              </span>
            )}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <Card>
              <CardContent className="py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-brand-black">Order Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                      className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:border-brand-red"
                    >
                      <option value="">All statuses</option>
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>{statusLabels[s] || s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-brand-black">Payment Method</label>
                    <select
                      value={paymentFilter}
                      onChange={(e) => { setPaymentFilter(e.target.value); setPage(1) }}
                      className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:border-brand-red"
                    >
                      <option value="">All methods</option>
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-brand-black">From Date</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                      className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:border-brand-red"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-brand-black">To Date</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                      className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:border-brand-red"
                    />
                  </div>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-5 flex items-center gap-2 text-sm font-semibold text-brand-red hover:underline"
                  >
                    <X className="w-4 h-4" />
                    Clear all filters
                  </button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-neutral-100 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!ordersData?.orders || ordersData.orders.length === 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 border-2 border-dashed border-neutral-200 rounded-2xl"
        >
          <Search className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-brand-black mb-2">No orders found</h3>
          <p className="text-neutral-400">
            {hasActiveFilters ? "Try adjusting your filters to see more orders" : "Orders will appear here once customers place them"}
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="mt-4 text-brand-red font-semibold hover:underline">
              Clear filters
            </button>
          )}
        </motion.div>
      )}

      {!isLoading && ordersData?.orders && ordersData.orders.length > 0 && (
        <>
          <div className="space-y-3">
            <AnimatePresence>
              {ordersData.orders.map((order, idx) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <Card
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <CardContent className="py-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-xl font-extrabold text-brand-black">
                              Order #{order.orderNumber}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-bold ${
                                statusColors[order.status] || "bg-neutral-100 text-neutral-700"
                              }`}
                            >
                              {statusLabels[order.status] || order.status}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-500 mt-1">
                            {order.table?.label && `${order.table.label} · `}
                            {formatTime(order.placedAt)}
                          </p>
                          <p className="text-sm text-neutral-600 mt-1.5 truncate">
                            {order.items.slice(0, 3).map((i) => `${i.quantity}× ${i.menuItem.name}`).join(", ")}
                            {order.items.length > 3 && ` +${order.items.length - 3} more`}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-6">
                          <p className="text-2xl font-extrabold text-brand-black">
                            {formatPrice(order.totalAmount)}
                          </p>
                          <div className="flex gap-1.5 mt-1.5 justify-end flex-wrap">
                            <Badge>{order.paymentMethod}</Badge>
                            <Badge variant={order.paymentStatus === "PAID" ? "success" : "warning"}>
                              {order.paymentStatus}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {ordersData.pagination.totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-4 mt-10"
            >
              <Button
                variant="outline"
                size="lg"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="w-5 h-5" /> Previous Page
              </Button>
              <span className="text-sm font-semibold text-neutral-600 px-2">
                Page {ordersData.pagination.page} of {ordersData.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="lg"
                disabled={page >= ordersData.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next Page <ChevronRight className="w-5 h-5" />
              </Button>
            </motion.div>
          )}
        </>
      )}

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Order #${selectedOrder.orderNumber}` : ""}
      >
        {selectedOrder && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                  statusColors[selectedOrder.status] || "bg-neutral-100 text-neutral-700"
                }`}
              >
                {statusLabels[selectedOrder.status] || selectedOrder.status}
              </span>
              <Badge>{selectedOrder.paymentMethod}</Badge>
              <Badge variant={selectedOrder.paymentStatus === "PAID" ? "success" : "warning"}>
                {selectedOrder.paymentStatus}
              </Badge>
            </div>

            <div className="bg-neutral-50 rounded-xl p-4 space-y-1.5 text-sm">
              {selectedOrder.table?.label && (
                <p className="text-neutral-600"><span className="font-semibold text-brand-black">Table:</span> {selectedOrder.table.label}</p>
              )}
              <p className="text-neutral-600"><span className="font-semibold text-brand-black">Placed at:</span> {formatTime(selectedOrder.placedAt)}</p>
            </div>

            {selectedOrder.specialInstructions && (
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3">
                <p className="text-sm font-bold text-brand-black">Special Instructions</p>
                <p className="text-sm text-neutral-600 mt-0.5">{selectedOrder.specialInstructions}</p>
              </div>
            )}

            <div className="border-t border-neutral-100 pt-4 space-y-3">
              <p className="text-sm font-bold text-neutral-500 uppercase tracking-wide">Order Items</p>
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <div>
                    <p className="font-semibold text-brand-black">
                      {item.quantity}× {item.menuItem.name}
                    </p>
                    {item.selectedOptions?.map((opt) => (
                      <p key={opt.customizationName} className="text-xs text-neutral-400 mt-0.5">
                        {opt.customizationName}: {opt.optionNames.join(", ")}
                      </p>
                    ))}
                  </div>
                  <span className="font-bold text-brand-black">{formatPrice(item.totalPrice)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-3 border-t border-neutral-100">
              <span className="text-lg font-bold text-brand-black">Total</span>
              <span className="text-2xl font-extrabold text-brand-black">
                {formatPrice(selectedOrder.totalAmount)}
              </span>
            </div>

            {ACTIVE_STATUSES.has(selectedOrder.status) && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-2 space-y-3"
              >
                {nextStatus[selectedOrder.status] && (
                  <Button
                    className="w-full"
                    size="lg"
                    variant={selectedOrder.status === "READY" ? "secondary" : "primary"}
                    loading={updateStatusMutation.isPending}
                    onClick={() =>
                      updateStatusMutation.mutate({
                        orderId: selectedOrder.id,
                        status: nextStatus[selectedOrder.status],
                      })
                    }
                  >
                    {nextStatusLabel[selectedOrder.status]}
                  </Button>
                )}

                {(selectedOrder.status === "PLACED" || selectedOrder.status === "ACCEPTED") && (
                  <div className="border border-brand-red/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-brand-red" />
                      <span className="text-sm font-bold text-brand-red">Cancel Order</span>
                    </div>
                    <Button
                      className="w-full border-brand-red text-brand-red hover:bg-red-50"
                      variant="outline"
                      loading={updateStatusMutation.isPending}
                      onClick={() =>
                        updateStatusMutation.mutate({ orderId: selectedOrder.id, status: "CANCELLED" })
                      }
                    >
                      <AlertTriangle className="w-4 h-4" /> Confirm Cancellation
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {selectedOrder.paymentMethod === "CASH" && selectedOrder.paymentStatus !== "PAID" && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
                <Button
                  className="w-full"
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    setCashOrder(selectedOrder)
                    setAmountReceived(String(Number(selectedOrder.totalAmount)))
                    setCashResult(null)
                    setSelectedOrder(null)
                  }}
                >
                  <Banknote className="w-5 h-5" /> Collect Cash Payment
                </Button>
              </motion.div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!cashOrder}
        onClose={() => { setCashOrder(null); setCashResult(null); setAmountReceived("") }}
        title={cashOrder ? `Collect Cash — Order #${cashOrder.orderNumber}` : ""}
      >
        {cashOrder && !cashResult && (() => {
          const orderAmt = Number(cashOrder.totalAmount)
          const entered = parseFloat(amountReceived) || 0
          const change = Math.max(0, entered - orderAmt)
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="bg-neutral-50 rounded-xl p-5">
                <p className="text-sm text-neutral-500 mb-1">Order Total</p>
                <p className="text-3xl font-extrabold text-brand-black">{formatPrice(orderAmt)}</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-brand-black">Amount Received from Customer</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-lg">₹</span>
                  <input
                    type="number"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="w-full pl-10 pr-4 py-4 rounded-xl border border-neutral-200 text-2xl font-extrabold text-brand-black focus:outline-none focus:border-brand-red"
                    min={orderAmt}
                    autoFocus
                  />
                </div>
              </div>

              {entered > orderAmt && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-red-50 border border-brand-red/20 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="w-4 h-4 text-brand-red" />
                    <span className="text-sm font-bold text-brand-red">Wallet Credit</span>
                  </div>
                  <p className="text-sm text-neutral-600">
                    <span className="font-bold text-brand-black">{formatPrice(change)}</span> change will be added to the customer's wallet
                  </p>
                </motion.div>
              )}

              {entered > 0 && entered < orderAmt && (
                <p className="text-sm text-brand-red font-semibold">
                  Amount must be at least {formatPrice(orderAmt)}
                </p>
              )}

              <div className="flex gap-3">
                <Button size="lg" variant="outline" className="flex-1" onClick={() => { setCashOrder(null); setAmountReceived("") }}>
                  Cancel
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  loading={collectCashMutation.isPending}
                  disabled={entered < orderAmt}
                  onClick={() => {
                    const amount = parseFloat(amountReceived)
                    if (isNaN(amount) || amount <= 0) return
                    collectCashMutation.mutate({ orderId: cashOrder.id, amountReceived: amount })
                  }}
                >
                  Confirm Payment
                </Button>
              </div>
            </motion.div>
          )
        })()}

        {cashResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-5"
          >
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <Banknote className="w-10 h-10 text-brand-red" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-brand-black">Payment Collected</h3>
              <p className="text-neutral-500 mt-1">Order #{cashResult.orderNumber}</p>
            </div>
            <div className="bg-neutral-50 rounded-xl p-5 space-y-3 text-left">
              <div className="flex justify-between">
                <span className="text-neutral-500">Order Amount</span>
                <span className="font-bold text-brand-black">{formatPrice(cashResult.orderAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Amount Received</span>
                <span className="font-bold text-brand-black">{formatPrice(cashResult.amountReceived)}</span>
              </div>
              {cashResult.changeAmount > 0 && (
                <div className="border-t border-neutral-200 pt-3 flex justify-between">
                  <span className="text-neutral-500">Change Added to Wallet</span>
                  <span className="font-bold text-brand-red">{formatPrice(cashResult.changeAmount)}</span>
                </div>
              )}
            </div>
            <Button size="lg" className="w-full" onClick={() => { setCashOrder(null); setCashResult(null); setAmountReceived("") }}>
              Done
            </Button>
          </motion.div>
        )}
      </Modal>
    </div>
  )
}
