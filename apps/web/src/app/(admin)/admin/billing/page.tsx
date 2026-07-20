"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  CreditCard,
  AlertTriangle,
  Check,
  X,
  Utensils,
  QrCode,
  Receipt,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PaymentModal } from "@/components/consumer/payment-modal"
import api from "@/lib/api"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"

type PlanName = "FREE" | "BASIC" | "PRO"

interface PlanFeatures {
  branding: boolean
  delivery: boolean
  viewAnalytics: boolean
  ar: boolean
}

interface PlanDefinition {
  name: PlanName
  label: string
  monthlyPrice: number
  maxMenuItems: number
  maxTables: number
  features: PlanFeatures
}

interface Subscription {
  id: string
  plan: PlanName
  status: string
  amount: number
  periodStart: string
  periodEnd: string
  createdAt: string
}

interface BillingData {
  plan: PlanName
  storedPlan: PlanName
  planValidUntil: string | null
  expired: boolean
  definition: PlanDefinition
  usage: {
    menuItems: number
    maxMenuItems: number
    tables: number
    maxTables: number
  }
  catalogue: PlanDefinition[]
  subscriptions: Subscription[]
}

function statusBadgeVariant(status: string): "success" | "warning" | "danger" | "default" {
  const normalized = status.toUpperCase()
  if (["PAID", "SUCCESS", "COMPLETED", "ACTIVE"].includes(normalized)) return "success"
  if (["FAILED", "CANCELLED", "EXPIRED"].includes(normalized)) return "danger"
  if (["PENDING", "CREATED"].includes(normalized)) return "warning"
  return "default"
}

function formatDate(date: string | null) {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function UsageMeter({
  label,
  icon,
  used,
  max,
}: {
  label: string
  icon: React.ReactNode
  used: number
  max: number
}) {
  const percent = max > 0 ? Math.min(100, (used / max) * 100) : 0
  const critical = percent >= 90

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500">
            {icon}
          </div>
          <p className="text-sm font-bold text-brand-black">{label}</p>
        </div>
        <p className={`text-sm font-bold ${critical ? "text-brand-red" : "text-neutral-500"}`}>
          {used} / {max}
        </p>
      </div>
      <div className="h-2.5 rounded-full bg-neutral-100 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={`h-full rounded-full ${critical ? "bg-brand-red" : "bg-brand-black"}`}
        />
      </div>
    </div>
  )
}

function FeatureRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {enabled ? (
        <Check className="w-4 h-4 text-brand-red shrink-0" />
      ) : (
        <X className="w-4 h-4 text-neutral-300 shrink-0" />
      )}
      <span className={`text-sm ${enabled ? "text-brand-black" : "text-neutral-400"}`}>{label}</span>
    </div>
  )
}

export default function BillingPage() {
  const queryClient = useQueryClient()
  const [restaurantId, setRestaurantId] = useState<string>("")
  const [upgradingPlan, setUpgradingPlan] = useState<PlanName | null>(null)
  const [paymentSession, setPaymentSession] = useState<any>(null)

  const { data: restaurants } = useQuery({
    queryKey: ["restaurants"],
    queryFn: () => api.get("/api/v1/restaurants").then((r) => r.data.data),
  })

  useEffect(() => {
    if (restaurants?.[0] && !restaurantId) {
      setRestaurantId(restaurants[0].id)
    }
  }, [restaurants, restaurantId])

  const { data, isLoading } = useQuery<BillingData>({
    queryKey: ["billing", restaurantId],
    queryFn: () => api.get(`/api/v1/restaurants/${restaurantId}/billing`).then((r) => r.data.data),
    enabled: !!restaurantId,
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    const outcome = new URLSearchParams(window.location.search).get("billing")
    if (!outcome) return
    if (outcome === "paid") toast.success("Plan upgraded — your subscription is active")
    else if (outcome === "failed") toast.error("Payment failed or was cancelled")
    else if (outcome === "invalid") toast.error("Payment could not be verified")
    else if (outcome === "pending") toast("Payment is still processing")
    queryClient.invalidateQueries({ queryKey: ["billing"] })
    queryClient.invalidateQueries({ queryKey: ["restaurants"] })
    window.history.replaceState({}, "", window.location.pathname)
  }, [queryClient])

  const handleUpgrade = async (plan: PlanName) => {
    if (!restaurantId || plan === "FREE") return
    setUpgradingPlan(plan)

    try {
      const { data: response } = await api.post(
        `/api/v1/restaurants/${restaurantId}/billing/checkout`,
        { plan }
      )
      const session = response.data
      if (!session?.redirectUrl) {
        toast.error("Could not start the upgrade")
        setUpgradingPlan(null)
        return
      }
      setPaymentSession(session)
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (status === 503 ? "Platform billing is not configured" : "Could not start upgrade")
      toast.error(message)
      setUpgradingPlan(null)
    }
  }

  const storedPlanDefinition = data?.catalogue?.find((d) => d.name === data.storedPlan)

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between mb-8"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-brand-red" />
            </div>
            <h1 className="text-3xl font-extrabold text-brand-black">Billing & Plan</h1>
          </div>
          <p className="text-neutral-500">Manage your subscription plan and view billing history</p>
        </div>
        {restaurants && restaurants.length > 1 && (
          <select
            value={restaurantId}
            onChange={(e) => setRestaurantId(e.target.value)}
            className="px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-brand-red"
          >
            {restaurants.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </motion.div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-neutral-100 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && data && (
        <div className="space-y-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <CardContent className="py-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Current Plan</p>
                    <div className="flex items-center gap-3">
                      <h2 className="text-3xl font-extrabold text-brand-black">{data.definition.label}</h2>
                      {data.plan !== "FREE" && <Badge variant="success">Active</Badge>}
                    </div>
                    <p className="text-sm text-neutral-500 mt-2">
                      {data.plan === "FREE"
                        ? "You are on the Free plan"
                        : `Renews on ${formatDate(data.planValidUntil)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-extrabold text-brand-black">
                      {formatPrice(data.definition.monthlyPrice)}
                    </p>
                    <p className="text-sm text-neutral-400">/month</p>
                  </div>
                </div>

                {data.expired && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 flex items-center gap-3 p-4 rounded-xl bg-brand-red/5 border border-brand-red/20"
                  >
                    <AlertTriangle className="w-5 h-5 text-brand-red shrink-0" />
                    <p className="text-sm font-semibold text-brand-red">
                      Your {storedPlanDefinition?.label || data.storedPlan} plan expired — you are on Free limits
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold text-brand-black">Usage</h2>
                <p className="text-sm text-neutral-400">How much of your plan's limits you're using</p>
              </CardHeader>
              <CardContent className="space-y-6 py-6">
                <UsageMeter
                  label="Menu Items"
                  icon={<Utensils className="w-4 h-4" />}
                  used={data.usage.menuItems}
                  max={data.usage.maxMenuItems}
                />
                <UsageMeter
                  label="Tables"
                  icon={<QrCode className="w-4 h-4" />}
                  used={data.usage.tables}
                  max={data.usage.maxTables}
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-brand-black">Plans</h2>
              <p className="text-neutral-500 text-sm">Pick the plan that fits your restaurant</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {data.catalogue.map((planDef, idx) => {
                const isActive = planDef.name === data.plan
                const showUpgrade = planDef.name !== "FREE" && !isActive

                return (
                  <motion.div
                    key={planDef.name}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * idx, type: "spring", damping: 20, stiffness: 200 }}
                    className="h-full"
                  >
                    <Card className={`h-full ${isActive ? "border-brand-red/40 ring-1 ring-brand-red/20" : ""}`}>
                      <CardContent className="py-6 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-lg font-extrabold text-brand-black">{planDef.label}</h3>
                          {isActive && <Badge variant="danger">Current</Badge>}
                          {planDef.name === "PRO" && !isActive && (
                            <Sparkles className="w-5 h-5 text-brand-red" />
                          )}
                        </div>
                        <div className="flex items-baseline gap-1 mb-5">
                          <span className="text-3xl font-extrabold text-brand-black">
                            {formatPrice(planDef.monthlyPrice)}
                          </span>
                          <span className="text-sm text-neutral-400">/month</span>
                        </div>

                        <div className="space-y-2 mb-5">
                          <p className="text-sm text-neutral-500">
                            Up to <strong className="text-brand-black">{planDef.maxMenuItems}</strong> menu items
                          </p>
                          <p className="text-sm text-neutral-500">
                            Up to <strong className="text-brand-black">{planDef.maxTables}</strong> tables
                          </p>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-neutral-100 mb-6">
                          <FeatureRow label="Custom Branding" enabled={planDef.features.branding} />
                          <FeatureRow label="Delivery Orders" enabled={planDef.features.delivery} />
                          <FeatureRow label="View Analytics" enabled={planDef.features.viewAnalytics} />
                          <FeatureRow label="AR Menu" enabled={planDef.features.ar} />
                        </div>

                        <div className="mt-auto">
                          {showUpgrade && (
                            <Button
                              size="lg"
                              className="w-full"
                              loading={upgradingPlan === planDef.name}
                              disabled={upgradingPlan !== null && upgradingPlan !== planDef.name}
                              onClick={() => handleUpgrade(planDef.name)}
                            >
                              Upgrade
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold text-brand-black">Billing History</h2>
                <p className="text-sm text-neutral-400">Past subscription payments</p>
              </CardHeader>
              <CardContent className="py-4">
                {data.subscriptions.length === 0 ? (
                  <div className="text-center py-16">
                    <Receipt className="w-14 h-14 text-neutral-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-brand-black mb-1">No billing history yet</h3>
                    <p className="text-neutral-400 text-sm">Your subscription payments will appear here</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-neutral-400 border-b border-neutral-100">
                          <th className="py-3 font-bold">Plan</th>
                          <th className="py-3 font-bold">Amount</th>
                          <th className="py-3 font-bold">Status</th>
                          <th className="py-3 font-bold">Period</th>
                          <th className="py-3 font-bold">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.subscriptions.map((sub) => (
                          <tr key={sub.id} className="border-b border-neutral-50 last:border-0">
                            <td className="py-4 font-bold text-brand-black">{sub.plan}</td>
                            <td className="py-4 text-brand-black">{formatPrice(sub.amount)}</td>
                            <td className="py-4">
                              <Badge variant={statusBadgeVariant(sub.status)}>{sub.status}</Badge>
                            </td>
                            <td className="py-4 text-neutral-500">
                              {formatDate(sub.periodStart)} – {formatDate(sub.periodEnd)}
                            </td>
                            <td className="py-4 text-neutral-500">{formatDate(sub.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      <PaymentModal
        open={!!paymentSession}
        session={paymentSession}
        title={upgradingPlan ? `Upgrade to ${upgradingPlan}` : undefined}
        onSuccess={() => {
          toast.success("Plan upgraded — your subscription is active")
          queryClient.invalidateQueries({ queryKey: ["billing"] })
          queryClient.invalidateQueries({ queryKey: ["restaurants"] })
          setPaymentSession(null)
          setUpgradingPlan(null)
        }}
        onClose={() => {
          setPaymentSession(null)
          setUpgradingPlan(null)
        }}
      />
    </div>
  )
}
