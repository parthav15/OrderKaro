"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  CreditCard,
  KeyRound,
  Info,
  RefreshCw,
  ExternalLink,
  Banknote,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MarketplaceOnboardingCard } from "@/components/admin/marketplace-onboarding-card"
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe"
import api from "@/lib/api"
import { toast } from "sonner"

type Provider = "STRIPE" | "CASHFREE"
type PaymentAccountStatus = "PENDING" | "ACTIVE" | "DISABLED"

interface PaymentAccountData {
  country: string
  currency: string
  provider: Provider
  commissionPercent: string
  capabilities: {
    hostedOnboarding: boolean
    platformFee: boolean
    webhooks: boolean
    refunds: boolean
  }
  connected: boolean
  status: PaymentAccountStatus
  cashfreeKeyPreview: string | null
  stripeKeyPreview: string | null
}

function statusBadgeVariant(status: PaymentAccountStatus): "success" | "warning" | "danger" {
  if (status === "ACTIVE") return "success"
  if (status === "DISABLED") return "danger"
  return "warning"
}

function GuideStep({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="w-6 h-6 rounded-full bg-surface-elevated text-ink text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {index}
      </span>
      <span className="text-sm text-muted leading-relaxed">{children}</span>
    </li>
  )
}

function extractErrorMessage(err: unknown, fallback: string) {
  const response = (err as { response?: { status?: number; data?: { error?: string } } })?.response
  if (response?.data?.error) return response.data.error
  if (response?.status === 503) return "This payment provider is not configured on the server"
  return fallback
}

export default function PaymentsPage() {
  const queryClient = useQueryClient()
  const reduceMotion = useReducedMotionSafe()
  const [restaurantId, setRestaurantId] = useState<string>("")
  const [appId, setAppId] = useState("")
  const [secretKey, setSecretKey] = useState("")
  const [replacingCredentials, setReplacingCredentials] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const { data: restaurants } = useQuery({
    queryKey: ["restaurants"],
    queryFn: () => api.get("/api/v1/restaurants").then((r) => r.data.data),
  })

  useEffect(() => {
    if (restaurants?.[0] && !restaurantId) {
      setRestaurantId(restaurants[0].id)
    }
  }, [restaurants, restaurantId])

  const { data, isLoading } = useQuery<PaymentAccountData>({
    queryKey: ["payment-account", restaurantId],
    queryFn: () =>
      api.get(`/api/v1/restaurants/${restaurantId}/payment-account`).then((r) => r.data.data),
    enabled: !!restaurantId,
  })

  const saveCredentials = useMutation({
    mutationFn: () =>
      api.put(
        `/api/v1/restaurants/${restaurantId}/payment-account`,
        data?.provider === "CASHFREE" ? { appId, secretKey } : { secretKey }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-account", restaurantId] })
      toast.success("Payment credentials saved")
      setAppId("")
      setSecretKey("")
      setReplacingCredentials(false)
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Could not save credentials")),
  })

  const disconnectAccount = useMutation({
    mutationFn: () => api.delete(`/api/v1/restaurants/${restaurantId}/payment-account`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-account", restaurantId] })
      toast.success("Payment account disconnected")
      setConfirmDisconnect(false)
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Could not disconnect account")),
  })

  const reconcilePayments = useMutation({
    mutationFn: () => api.post(`/api/v1/restaurants/${restaurantId}/payments/reconcile`),
    onSuccess: (res) => {
      const { checked, confirmed } = res.data?.data ?? { checked: 0, confirmed: 0 }
      toast.success(`Checked ${checked} pending payments, confirmed ${confirmed}`)
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Could not reconcile payments")),
  })

  const showCredentialForm = !data?.connected || replacingCredentials
  const stripeKeyValid = /^(sk|rk)_(live|test)_/.test(secretKey)

  return (
    <div className="max-w-2xl mx-auto">
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
            <h1 className="text-3xl font-extrabold text-ink">Payments</h1>
          </div>
          <p className="text-muted">Get paid by Vision Menu, or connect your own payment gateway</p>
        </div>
        {restaurants && restaurants.length > 1 && (
          <select
            value={restaurantId}
            onChange={(e) => setRestaurantId(e.target.value)}
            className="px-4 py-3 rounded-xl border border-line text-sm focus:outline-none focus:border-brand-red"
          >
            {restaurants.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </motion.div>

      {restaurantId && (
        <div className="mb-8">
          <MarketplaceOnboardingCard key={restaurantId} restaurantId={restaurantId} />
        </div>
      )}

      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-surface-elevated animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && data && (
        <div className="space-y-8">
          <div>
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-elevated/60 px-5 py-4 text-left transition-colors hover:bg-surface-elevated"
            >
              <div>
                <p className="text-sm font-bold text-ink">Advanced: use your own payment gateway instead</p>
                <p className="text-xs text-muted mt-0.5">
                  Connect your own Cashfree or Stripe account and collect diner payments directly
                </p>
              </div>
              <motion.span
                animate={{ rotate: advancedOpen ? 180 : 0 }}
                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 26 }}
              >
                <ChevronDown className="w-5 h-5 text-muted shrink-0" />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {advancedOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: reduceMotion ? 0.01 : 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="overflow-hidden"
                >
                  <div className="pt-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-surface-elevated flex items-center justify-center">
                      <KeyRound className="w-5 h-5 text-muted" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-ink">
                        {data.provider === "CASHFREE" ? "Cashfree" : "Stripe"}
                      </h2>
                      <p className="text-sm text-muted">
                        Settles in {data.currency} · {data.country}
                      </p>
                    </div>
                  </div>
                  <Badge variant={statusBadgeVariant(data.status)}>{data.status}</Badge>
                </div>
              </CardHeader>

              {data.provider === "CASHFREE" ? (
                <CardContent className="space-y-6 py-6">
                  <ol className="space-y-3">
                    <GuideStep index={1}>
                      Create an account at{" "}
                      <a
                        href="https://merchant.cashfree.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-red font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        merchant.cashfree.com <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </GuideStep>
                    <GuideStep index={2}>Open Developers → API Keys</GuideStep>
                    <GuideStep index={3}>Generate and copy your App ID and Secret Key</GuideStep>
                    <GuideStep index={4}>Paste them below</GuideStep>
                  </ol>

                  {!showCredentialForm ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-surface-elevated border border-line">
                        <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">
                          Connected key
                        </p>
                        <p className="text-sm font-semibold text-ink font-mono">
                          {data.cashfreeKeyPreview}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setReplacingCredentials(true)}
                        >
                          Replace credentials
                        </Button>
                        {!confirmDisconnect ? (
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => setConfirmDisconnect(true)}
                          >
                            Disconnect
                          </Button>
                        ) : (
                          <AnimatePresence mode="wait">
                            <motion.div
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center gap-2"
                            >
                              <span className="text-sm text-muted">Are you sure?</span>
                              <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                loading={disconnectAccount.isPending}
                                onClick={() => disconnectAccount.mutate()}
                              >
                                Yes, disconnect
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setConfirmDisconnect(false)}
                              >
                                Cancel
                              </Button>
                            </motion.div>
                          </AnimatePresence>
                        )}
                      </div>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        saveCredentials.mutate()
                      }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-ink">App ID</label>
                        <input
                          type="text"
                          value={appId}
                          onChange={(e) => setAppId(e.target.value)}
                          placeholder="x-client-id"
                          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-muted transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-ink">
                          Secret key
                        </label>
                        <input
                          type="password"
                          value={secretKey}
                          onChange={(e) => setSecretKey(e.target.value)}
                          placeholder="cfsk_…"
                          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-muted transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          type="submit"
                          loading={saveCredentials.isPending}
                          disabled={!appId || !secretKey}
                        >
                          Save credentials
                        </Button>
                        {data.connected && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setReplacingCredentials(false)
                              setAppId("")
                              setSecretKey("")
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </form>
                  )}

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-elevated border border-line">
                    <Info className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                    <p className="text-sm text-muted leading-relaxed">
                      PayPur does not offer webhooks or a refund API. Payment confirmation relies on
                      the diner returning to the app plus background reconciliation, and refunds must
                      be issued manually over UPI.
                    </p>
                  </div>
                </CardContent>
              ) : (
                <CardContent className="space-y-6 py-6">
                  <ol className="space-y-3">
                    <GuideStep index={1}>
                      Create or sign in to your account at{" "}
                      <a
                        href="https://dashboard.stripe.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-red font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        dashboard.stripe.com <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </GuideStep>
                    <GuideStep index={2}>Go to Developers → API keys</GuideStep>
                    <GuideStep index={3}>
                      Copy your Secret key (starts with sk_live_ or sk_test_)
                    </GuideStep>
                    <GuideStep index={4}>Paste it below</GuideStep>
                  </ol>

                  {!showCredentialForm ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-surface-elevated border border-line">
                        <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">
                          Connected key
                        </p>
                        <p className="text-sm font-semibold text-ink font-mono">
                          {data.stripeKeyPreview}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setReplacingCredentials(true)}
                        >
                          Replace key
                        </Button>
                        {!confirmDisconnect ? (
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => setConfirmDisconnect(true)}
                          >
                            Disconnect
                          </Button>
                        ) : (
                          <AnimatePresence mode="wait">
                            <motion.div
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center gap-2"
                            >
                              <span className="text-sm text-muted">Are you sure?</span>
                              <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                loading={disconnectAccount.isPending}
                                onClick={() => disconnectAccount.mutate()}
                              >
                                Yes, disconnect
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setConfirmDisconnect(false)}
                              >
                                Cancel
                              </Button>
                            </motion.div>
                          </AnimatePresence>
                        )}
                      </div>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        saveCredentials.mutate()
                      }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-ink">
                          Secret key
                        </label>
                        <input
                          type="password"
                          value={secretKey}
                          onChange={(e) => setSecretKey(e.target.value)}
                          placeholder="sk_live_..."
                          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-muted transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                        />
                        {secretKey && !stripeKeyValid && (
                          <p className="text-sm text-brand-red">
                            This doesn't look like a Stripe secret key — it should start with
                            sk_live_ or sk_test_
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          type="submit"
                          loading={saveCredentials.isPending}
                          disabled={!stripeKeyValid}
                        >
                          Save key
                        </Button>
                        {data.connected && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setReplacingCredentials(false)
                              setSecretKey("")
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </form>
                  )}

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-elevated border border-line">
                    <Info className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                    <p className="text-sm text-muted leading-relaxed">
                      Your Stripe key is encrypted and never shown again. Diners pay your Stripe
                      account directly — Vision Menu never holds the money. Payment confirmation uses
                      the return redirect plus background reconciliation.
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-surface-elevated flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-muted" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-ink">Pending payments</h2>
                    <p className="text-sm text-muted">
                      Catches payments where the diner closed the tab before returning
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-6">
                <Button
                  variant="outline"
                  loading={reconcilePayments.isPending}
                  onClick={() => reconcilePayments.mutate()}
                >
                  <RefreshCw className="w-4 h-4" /> Reconcile now
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  )
}
