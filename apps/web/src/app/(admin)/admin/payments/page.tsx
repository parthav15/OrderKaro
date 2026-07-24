"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useQuery, useMutation } from "@tanstack/react-query"
import { CreditCard, RefreshCw, Banknote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { MarketplaceOnboardingCard } from "@/components/admin/marketplace-onboarding-card"
import { StripeConnectCard } from "@/components/admin/stripe-connect-card"
import api from "@/lib/api"
import { toast } from "sonner"

interface PaymentAccountData {
  country: string
}

function extractErrorMessage(err: unknown, fallback: string) {
  const response = (err as { response?: { status?: number; data?: { error?: string } } })?.response
  if (response?.data?.error) return response.data.error
  if (response?.status === 503) return "This payment provider is not configured on the server"
  return fallback
}

export default function PaymentsPage() {
  const [restaurantId, setRestaurantId] = useState<string>("")

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

  const reconcilePayments = useMutation({
    mutationFn: () => api.post(`/api/v1/restaurants/${restaurantId}/payments/reconcile`),
    onSuccess: (res) => {
      const { checked, confirmed } = res.data?.data ?? { checked: 0, confirmed: 0 }
      toast.success(`Checked ${checked} pending payments, confirmed ${confirmed}`)
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Could not reconcile payments")),
  })

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
          <p className="text-muted">Get paid by Vision Menu — set up your payouts below</p>
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

      {restaurantId && !isLoading && data && (
        <div className="mb-8">
          {data.country === "IN" ? (
            <MarketplaceOnboardingCard key={restaurantId} restaurantId={restaurantId} />
          ) : (
            <StripeConnectCard key={restaurantId} restaurantId={restaurantId} />
          )}
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
      )}
    </div>
  )
}
