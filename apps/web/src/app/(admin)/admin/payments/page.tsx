"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  CreditCard,
  KeyRound,
  Info,
  Check,
  X,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Banknote,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Provider = "PAYPUR" | "STRIPE"
type PaymentAccountStatus = "PENDING" | "ACTIVE" | "DISABLED"

interface StripeAccountInfo {
  accountId: string
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
}

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
  stripe: StripeAccountInfo | null
  paypurKeyPreview: string | null
}

function statusBadgeVariant(status: PaymentAccountStatus): "success" | "warning" | "danger" {
  if (status === "ACTIVE") return "success"
  if (status === "DISABLED") return "danger"
  return "warning"
}

function StatusChip({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl border",
        active ? "border-brand-black/10 bg-neutral-50" : "border-neutral-200 bg-white"
      )}
    >
      {active ? (
        <Check className="w-4 h-4 text-brand-red shrink-0" />
      ) : (
        <X className="w-4 h-4 text-neutral-300 shrink-0" />
      )}
      <span className={cn("text-sm font-semibold", active ? "text-brand-black" : "text-neutral-400")}>
        {label}
      </span>
    </div>
  )
}

function GuideStep({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="w-6 h-6 rounded-full bg-neutral-100 text-brand-black text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {index}
      </span>
      <span className="text-sm text-neutral-600 leading-relaxed">{children}</span>
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
  const searchParams = useSearchParams()
  const [restaurantId, setRestaurantId] = useState<string>("")
  const [apiKey, setApiKey] = useState("")
  const [signingSecret, setSigningSecret] = useState("")
  const [replacingCredentials, setReplacingCredentials] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)
  const stripeReturnHandled = useRef(false)

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
      api.put(`/api/v1/restaurants/${restaurantId}/payment-account`, { apiKey, signingSecret }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-account", restaurantId] })
      toast.success("Payment credentials saved")
      setApiKey("")
      setSigningSecret("")
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

  const startStripeOnboarding = useMutation({
    mutationFn: () => api.post(`/api/v1/restaurants/${restaurantId}/payment-account/stripe-onboarding`),
    onSuccess: (res) => {
      const url = res.data?.data?.onboardingUrl
      if (url) window.location.href = url
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Could not start onboarding")),
  })

  const refreshStripeStatus = useMutation({
    mutationFn: () => api.get(`/api/v1/restaurants/${restaurantId}/payment-account/stripe-onboarding`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-account", restaurantId] })
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Could not refresh onboarding status")),
  })

  const reconcilePayments = useMutation({
    mutationFn: () => api.post(`/api/v1/restaurants/${restaurantId}/payments/reconcile`),
    onSuccess: (res) => {
      const { checked, confirmed } = res.data?.data ?? { checked: 0, confirmed: 0 }
      toast.success(`Checked ${checked} pending payments, confirmed ${confirmed}`)
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Could not reconcile payments")),
  })

  useEffect(() => {
    if (
      searchParams.get("stripe") === "return" &&
      restaurantId &&
      !stripeReturnHandled.current
    ) {
      stripeReturnHandled.current = true
      refreshStripeStatus.mutate()
    }
  }, [searchParams, restaurantId])

  const showCredentialForm = !data?.connected || replacingCredentials

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
            <h1 className="text-3xl font-extrabold text-brand-black">Payments</h1>
          </div>
          <p className="text-neutral-500">Connect the account that receives your diners' money</p>
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
        <div className="space-y-4 max-w-2xl">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-neutral-100 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && data && (
        <div className="space-y-8 max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center">
                      <KeyRound className="w-5 h-5 text-neutral-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-brand-black">
                        {data.provider === "PAYPUR" ? "PayPur" : "Stripe"}
                      </h2>
                      <p className="text-sm text-neutral-400">
                        Settles in {data.currency} · {data.country}
                      </p>
                    </div>
                  </div>
                  <Badge variant={statusBadgeVariant(data.status)}>{data.status}</Badge>
                </div>
              </CardHeader>

              {data.provider === "PAYPUR" ? (
                <CardContent className="space-y-6 py-6">
                  <ol className="space-y-3">
                    <GuideStep index={1}>
                      Create a free account at{" "}
                      <a
                        href="https://upi.paypur.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-red font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        upi.paypur.in <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </GuideStep>
                    <GuideStep index={2}>Open API &amp; SDK → Credentials</GuideStep>
                    <GuideStep index={3}>Copy the Gateway Key and Gateway Salt</GuideStep>
                    <GuideStep index={4}>Paste them below</GuideStep>
                  </ol>

                  {!showCredentialForm ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                        <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
                          Connected key
                        </p>
                        <p className="text-sm font-semibold text-brand-black font-mono">
                          {data.paypurKeyPreview}
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
                              <span className="text-sm text-neutral-500">Are you sure?</span>
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
                        <label className="block text-sm font-bold text-brand-black">API key</label>
                        <input
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="Gateway Key"
                          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-brand-black placeholder:text-neutral-400 transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-brand-black">
                          Signing secret (salt)
                        </label>
                        <input
                          type="password"
                          value={signingSecret}
                          onChange={(e) => setSigningSecret(e.target.value)}
                          placeholder="Gateway Salt"
                          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-brand-black placeholder:text-neutral-400 transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          type="submit"
                          loading={saveCredentials.isPending}
                          disabled={!apiKey || !signingSecret}
                        >
                          Save credentials
                        </Button>
                        {data.connected && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setReplacingCredentials(false)
                              setApiKey("")
                              setSigningSecret("")
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </form>
                  )}

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                    <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-neutral-500 leading-relaxed">
                      PayPur does not offer webhooks or a refund API. Payment confirmation relies on
                      the diner returning to the app plus background reconciliation, and refunds must
                      be issued manually over UPI.
                    </p>
                  </div>
                </CardContent>
              ) : (
                <CardContent className="space-y-6 py-6">
                  {!data.stripe ? (
                    <div className="space-y-4">
                      <p className="text-sm text-neutral-500">
                        Connect your Stripe account to start receiving payouts from diner orders.
                      </p>
                      <Button
                        loading={startStripeOnboarding.isPending}
                        onClick={() => startStripeOnboarding.mutate()}
                      >
                        Connect with Stripe
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <StatusChip label="Details submitted" active={data.stripe.detailsSubmitted} />
                        <StatusChip label="Charges enabled" active={data.stripe.chargesEnabled} />
                        <StatusChip label="Payouts enabled" active={data.stripe.payoutsEnabled} />
                      </div>

                      {!data.stripe.detailsSubmitted && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 p-4 rounded-xl bg-brand-red/5 border border-brand-red/20"
                        >
                          <AlertTriangle className="w-5 h-5 text-brand-red shrink-0" />
                          <p className="text-sm font-semibold text-brand-red">
                            Onboarding incomplete — finish it to receive payouts
                          </p>
                        </motion.div>
                      )}

                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          loading={refreshStripeStatus.isPending}
                          onClick={() => refreshStripeStatus.mutate()}
                        >
                          <RefreshCw className="w-4 h-4" /> Refresh status
                        </Button>
                        {!data.stripe.detailsSubmitted && (
                          <Button
                            loading={startStripeOnboarding.isPending}
                            onClick={() => startStripeOnboarding.mutate()}
                          >
                            Continue onboarding
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-neutral-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-brand-black">Pending payments</h2>
                    <p className="text-sm text-neutral-400">
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
