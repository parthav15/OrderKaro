"use client"

import { useEffect, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Wallet,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Users,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import api from "@/lib/api"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"

interface RechargeRequest {
  id: string
  amount: string
  reference: string | null
  description: string | null
  createdAt: string
  wallet: {
    consumer: {
      id: string
      name: string
      phone: string
    }
  }
}

interface WalletTransaction {
  id: string
  type: "CREDIT" | "DEBIT"
  amount: string
  description: string | null
  createdAt: string
  consumer: {
    id: string
    name: string
    phone: string
  }
}

interface Consumer {
  id: string
  name: string
  phone: string
  wallet: {
    balance: string
    transactions?: WalletTransaction[]
  } | null
}

interface AnalyticsStat {
  label: string
  value: string
  subtext: string
  icon: React.ReactNode
  highlight?: boolean
}

function StatCard({ stat, index }: { stat: AnalyticsStat; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: "spring", damping: 20, stiffness: 200 }}
    >
      <Card className={stat.highlight ? "border-brand-red/20 bg-brand-red/[0.02]" : ""}>
        <CardContent className="py-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                {stat.label}
              </p>
              <p className={`text-2xl font-extrabold mt-1 ${stat.highlight ? "text-brand-red" : "text-brand-black"}`}>
                {stat.value}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">{stat.subtext}</p>
            </div>
            <div className={`p-2.5 rounded-xl ${stat.highlight ? "bg-brand-red/10 text-brand-red" : "bg-neutral-100 text-neutral-500"}`}>
              {stat.icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function WalletManagement() {
  const queryClient = useQueryClient()
  const [canteenId, setCanteenId] = useState<string>("")
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [creditForm, setCreditForm] = useState({ consumerId: "", amount: "", description: "" })
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<"overview" | "requests" | "consumers">("overview")

  const { data: canteens } = useQuery({
    queryKey: ["canteens"],
    queryFn: () => api.get("/api/v1/canteens").then((r) => r.data.data),
  })

  useEffect(() => {
    if (canteens?.[0] && !canteenId) {
      setCanteenId(canteens[0].id)
    }
  }, [canteens, canteenId])

  const { data: requests, isLoading: requestsLoading, refetch: refetchRequests } = useQuery<RechargeRequest[]>({
    queryKey: ["wallet-requests", canteenId],
    queryFn: () =>
      api.get(`/api/v1/canteens/${canteenId}/wallet/requests`).then((r) => r.data.data),
    enabled: !!canteenId,
    refetchInterval: 15000,
  })

  const { data: consumersData, isLoading: consumersLoading } = useQuery<{ consumers: Consumer[] }>({
    queryKey: ["consumers", canteenId],
    queryFn: () =>
      api.get(`/api/v1/canteens/${canteenId}/consumers`).then((r) => r.data.data),
    enabled: !!canteenId,
  })

  const { data: activityData, isLoading: activityLoading } = useQuery<WalletTransaction[]>({
    queryKey: ["wallet-activity", canteenId],
    queryFn: () =>
      api
        .get(`/api/v1/canteens/${canteenId}/wallet/transactions?limit=10`)
        .then((r) => r.data.data),
    enabled: !!canteenId,
    refetchInterval: 30000,
  })

  const analytics = useMemo(() => {
    const consumers = consumersData?.consumers || []
    const pendingRequests = requests || []

    const consumersWithWallet = consumers.filter((c) => c.wallet !== null)
    const totalBalance = consumersWithWallet.reduce(
      (sum, c) => sum + Number(c.wallet?.balance || 0),
      0
    )
    const pendingAmount = pendingRequests.reduce((sum, r) => sum + Number(r.amount), 0)

    return {
      totalConsumers: consumers.length,
      consumersWithWallet: consumersWithWallet.length,
      totalBalance,
      pendingCount: pendingRequests.length,
      pendingAmount,
    }
  }, [consumersData, requests])

  const handleRequest = useMutation({
    mutationFn: ({ reqId, status, note }: { reqId: string; status: string; note?: string }) =>
      api.patch(`/api/v1/canteens/${canteenId}/wallet/requests/${reqId}`, { status, note }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wallet-requests"] })
      queryClient.invalidateQueries({ queryKey: ["consumers"] })
      queryClient.invalidateQueries({ queryKey: ["wallet-activity"] })
      toast.success(
        variables.status === "APPROVED"
          ? "Recharge approved and wallet credited"
          : "Request rejected"
      )
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to process request"),
  })

  const creditWallet = useMutation({
    mutationFn: (data: any) => api.post(`/api/v1/canteens/${canteenId}/wallet/credit`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumers"] })
      queryClient.invalidateQueries({ queryKey: ["wallet-activity"] })
      setShowCreditModal(false)
      setCreditForm({ consumerId: "", amount: "", description: "" })
      toast.success("Wallet credited successfully")
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to credit wallet"),
  })

  const filteredConsumers = consumersData?.consumers?.filter((c) =>
    search
      ? c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
      : true
  )

  const statCards: AnalyticsStat[] = [
    {
      label: "Total Consumers",
      value: String(analytics.totalConsumers),
      subtext: `${analytics.consumersWithWallet} with active wallets`,
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: "Total Wallet Balance",
      value: formatPrice(analytics.totalBalance),
      subtext: "Across all consumer wallets",
      icon: <TrendingUp className="w-5 h-5" />,
      highlight: true,
    },
    {
      label: "Pending Requests",
      value: String(analytics.pendingCount),
      subtext: analytics.pendingCount > 0 ? "Awaiting approval" : "All caught up",
      icon: <Clock className="w-5 h-5" />,
      highlight: analytics.pendingCount > 0,
    },
    {
      label: "Pending Amount",
      value: formatPrice(analytics.pendingAmount),
      subtext: "Total amount in pending requests",
      icon: <Wallet className="w-5 h-5" />,
    },
  ]

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    {
      id: "requests" as const,
      label: "Requests",
      badge: analytics.pendingCount > 0 ? analytics.pendingCount : null,
    },
    { id: "consumers" as const, label: "Consumers" },
  ]

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-extrabold text-brand-black">Wallet Management</h1>
          <p className="text-neutral-500 mt-1">Analytics, recharge requests, and consumer balances</p>
        </div>
        <div className="flex items-center gap-3">
          {canteens && canteens.length > 1 && (
            <select
              value={canteenId}
              onChange={(e) => setCanteenId(e.target.value)}
              className="px-4 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-brand-red"
            >
              {canteens.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          <Button onClick={() => setShowCreditModal(true)}>
            <Wallet className="w-4 h-4" />
            Credit Wallet
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} index={i} />
        ))}
      </div>

      <div className="flex gap-1 mb-6 border-b border-neutral-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === tab.id ? "text-brand-black" : "text-neutral-400 hover:text-neutral-600"
            }`}
          >
            <span className="flex items-center gap-1.5">
              {tab.label}
              {tab.badge != null && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-red text-white text-xs font-bold">
                  {tab.badge}
                </span>
              )}
            </span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="wallet-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-black rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-brand-black">Recent Activity</h2>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ["wallet-activity"] })}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-neutral-500" />
              </button>
            </div>

            {activityLoading && (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-neutral-100 animate-pulse" />
                ))}
              </div>
            )}

            {!activityLoading && (!activityData || activityData.length === 0) && (
              <div className="text-center py-16 border border-dashed border-neutral-200 rounded-2xl">
                <TrendingUp className="w-10 h-10 text-neutral-200 mx-auto mb-2" />
                <p className="text-neutral-400 font-medium text-sm">No transactions yet</p>
              </div>
            )}

            {!activityLoading && activityData && activityData.length > 0 && (
              <div className="space-y-2">
                {activityData.map((tx, idx) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <Card>
                      <CardContent className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-xl flex-shrink-0 ${
                              tx.type === "CREDIT"
                                ? "bg-neutral-100 text-brand-black"
                                : "bg-red-50 text-brand-red"
                            }`}
                          >
                            {tx.type === "CREDIT" ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-brand-black text-sm">{tx.consumer?.name}</p>
                            <p className="text-xs text-neutral-400">{tx.consumer?.phone}</p>
                            {tx.description && (
                              <p className="text-xs text-neutral-400 truncate max-w-xs">{tx.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p
                            className={`font-bold text-base ${
                              tx.type === "CREDIT" ? "text-brand-black" : "text-brand-red"
                            }`}
                          >
                            {tx.type === "CREDIT" ? "+" : "-"}{formatPrice(tx.amount)}
                          </p>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            {new Date(tx.createdAt).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "requests" && (
          <motion.div
            key="requests"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-brand-black">
                Pending Recharge Requests
                {requests && requests.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-red text-white text-xs font-bold">
                    {requests.length}
                  </span>
                )}
              </h2>
              <button
                onClick={() => refetchRequests()}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-neutral-500" />
              </button>
            </div>

            {requestsLoading && (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 rounded-xl bg-neutral-100 animate-pulse" />
                ))}
              </div>
            )}

            {!requestsLoading && (!requests || requests.length === 0) && (
              <div className="text-center py-10 border border-dashed border-neutral-200 rounded-2xl">
                <CheckCircle2 className="w-10 h-10 text-neutral-200 mx-auto mb-2" />
                <p className="text-neutral-400 font-medium text-sm">No pending requests</p>
              </div>
            )}

            {!requestsLoading && requests && requests.length > 0 && (
              <div className="space-y-3">
                <AnimatePresence>
                  {requests.map((req, idx) => (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card>
                        <CardContent className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-brand-black">{req.wallet?.consumer?.name}</p>
                            <p className="text-sm text-neutral-500">{req.wallet?.consumer?.phone}</p>
                            <p className="text-sm mt-1">
                              Amount:{" "}
                              <span className="font-bold text-brand-black">{formatPrice(req.amount)}</span>
                            </p>
                            {req.reference && (
                              <p className="text-xs text-neutral-400 mt-0.5">Ref: {req.reference}</p>
                            )}
                            {req.description && (
                              <p className="text-xs text-neutral-400">{req.description}</p>
                            )}
                            <p className="text-xs text-neutral-400 mt-1">
                              {new Date(req.createdAt).toLocaleString("en-IN", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              loading={handleRequest.isPending}
                              onClick={() =>
                                handleRequest.mutate({ reqId: req.id, status: "APPROVED" })
                              }
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              loading={handleRequest.isPending}
                              onClick={() =>
                                handleRequest.mutate({
                                  reqId: req.id,
                                  status: "REJECTED",
                                  note: "Rejected by admin",
                                })
                              }
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "consumers" && (
          <motion.div
            key="consumers"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-brand-black">Consumers</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-brand-red w-64"
                />
              </div>
            </div>

            {consumersLoading && (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-neutral-100 animate-pulse" />
                ))}
              </div>
            )}

            {!consumersLoading && (!filteredConsumers || filteredConsumers.length === 0) && (
              <div className="text-center py-12 border border-dashed border-neutral-200 rounded-2xl">
                <Wallet className="w-10 h-10 text-neutral-200 mx-auto mb-2" />
                <p className="text-neutral-400 font-medium text-sm">No consumers found</p>
              </div>
            )}

            <div className="space-y-2">
              {filteredConsumers?.map((consumer, idx) => (
                <motion.div
                  key={consumer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <Card>
                    <CardContent className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-neutral-600">
                            {consumer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-brand-black text-sm">{consumer.name}</p>
                          <p className="text-xs text-neutral-500">{consumer.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-neutral-400">Balance</p>
                          <p className="text-base font-bold text-brand-black">
                            {formatPrice(consumer.wallet?.balance || 0)}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setCreditForm({ consumerId: consumer.id, amount: "", description: "" })
                            setShowCreditModal(true)
                          }}
                          className="text-xs text-brand-red font-semibold hover:underline whitespace-nowrap"
                        >
                          Credit
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal isOpen={showCreditModal} onClose={() => setShowCreditModal(false)} title="Credit Wallet">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            creditWallet.mutate({
              consumerId: creditForm.consumerId,
              amount: Number(creditForm.amount),
              description: creditForm.description || undefined,
            })
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1.5">Consumer</label>
            <select
              value={creditForm.consumerId}
              onChange={(e) => setCreditForm({ ...creditForm, consumerId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-brand-red"
              required
            >
              <option value="">Select consumer</option>
              {consumersData?.consumers?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Amount (₹)"
            type="number"
            min="1"
            value={creditForm.amount}
            onChange={(e) => setCreditForm({ ...creditForm, amount: e.target.value })}
            required
          />
          <Input
            label="Description (optional)"
            placeholder="Cash deposit"
            value={creditForm.description}
            onChange={(e) => setCreditForm({ ...creditForm, description: e.target.value })}
          />
          <Button type="submit" className="w-full" loading={creditWallet.isPending}>
            Credit Wallet
          </Button>
        </form>
      </Modal>
    </div>
  )
}
