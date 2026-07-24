"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Landmark, ShieldCheck, Clock, Check, AlertTriangle, Loader2, ArrowUpRight } from "lucide-react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe"
import { cn } from "@/lib/utils"
import api from "@/lib/api"
import { toast } from "sonner"

type StripeConnectViewState = "connect" | "incomplete" | "active"

interface StripeConnectData {
  connected: boolean
  onboarded: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  collectionMode: "BYO" | "MARKETPLACE"
}

interface StripeOnboardingResponse {
  onboardingUrl: string
  accountId: string
}

function extractErrorMessage(err: unknown, fallback: string) {
  const response = (err as { response?: { data?: { error?: string } } })?.response
  return response?.data?.error || fallback
}

function resolveViewState(data: StripeConnectData): StripeConnectViewState {
  if (data.chargesEnabled) return "active"
  if (data.connected) return "incomplete"
  return "connect"
}

function viewCopy(viewState: StripeConnectViewState) {
  if (viewState === "active") {
    return { title: "Payouts active", subtitle: "Settling straight to your connected Stripe account" }
  }
  if (viewState === "incomplete") {
    return { title: "Setup incomplete", subtitle: "A few more details are needed before payouts can start" }
  }
  return { title: "Get paid by Vision Menu", subtitle: "Payouts settle straight to your Stripe account" }
}

function viewActionLabel(viewState: StripeConnectViewState) {
  if (viewState === "active") return "Manage on Stripe"
  if (viewState === "incomplete") return "Continue on Stripe"
  return "Connect payouts with Stripe"
}

function StatusChip({ label, active, index }: { label: string; active: boolean; index: number }) {
  const reduceMotion = useReducedMotionSafe()
  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0.01 : 0.4,
        delay: reduceMotion ? 0 : 0.08 * index,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={cn(
        "flex items-center gap-2.5 rounded-xl border px-4 py-3",
        active ? "border-success/25 bg-success/5" : "border-line bg-surface-elevated"
      )}
    >
      <motion.span
        initial={false}
        animate={active ? { scale: [0.5, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
          active ? "bg-success/15 text-success" : "bg-surface text-muted"
        )}
      >
        {active ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
      </motion.span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink truncate">{label}</p>
        {!active && <p className="text-xs text-muted">Pending</p>}
      </div>
    </motion.div>
  )
}

interface StripeConnectCardProps {
  restaurantId: string
}

export function StripeConnectCard({ restaurantId }: StripeConnectCardProps) {
  const reduceMotion = useReducedMotionSafe()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const stripeParam = searchParams.get("stripe")

  const [returning, setReturning] = useState(() => Boolean(stripeParam))
  const [redirecting, setRedirecting] = useState(false)
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data, isLoading, isError, refetch } = useQuery<StripeConnectData>({
    queryKey: ["stripe-connect", restaurantId],
    queryFn: () =>
      api.get(`/api/v1/restaurants/${restaurantId}/stripe-connect`).then((r) => r.data.data),
    enabled: !!restaurantId,
  })

  useEffect(() => {
    if (!stripeParam) return
    let cancelled = false
    setReturning(true)
    refetch().finally(() => {
      if (cancelled) return
      setReturning(false)
      const nextParams = new URLSearchParams(searchParams.toString())
      nextParams.delete("stripe")
      const qs = nextParams.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    })
    return () => {
      cancelled = true
    }
  }, [stripeParam])

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current)
    }
  }, [])

  const connectMutation = useMutation({
    mutationFn: () =>
      api
        .post(`/api/v1/restaurants/${restaurantId}/stripe-connect`)
        .then((r) => r.data.data as StripeOnboardingResponse),
    onSuccess: (payload) => {
      setRedirecting(true)
      redirectTimeoutRef.current = setTimeout(() => {
        window.location.href = payload.onboardingUrl
      }, 250)
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Could not start Stripe onboarding")),
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="h-7 w-64 rounded-lg bg-surface-elevated animate-pulse mb-3" />
          <div className="h-4 w-full max-w-sm rounded-lg bg-surface-elevated animate-pulse mb-8" />
          <div className="h-24 rounded-xl bg-surface-elevated animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="py-10 flex flex-col items-center text-center gap-3">
          <AlertTriangle className="w-8 h-8 text-danger/50" />
          <p className="text-sm font-semibold text-ink">Couldn&apos;t load your Stripe status</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (returning) {
    return (
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <Card className="border-primary/15 shadow-md">
          <CardContent className="py-14 flex flex-col items-center text-center gap-4">
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
            <div>
              <p className="text-base font-bold text-ink">Finishing setup…</p>
              <p className="text-sm text-muted mt-1">Confirming your details with Stripe</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const viewState = resolveViewState(data)
  const copy = viewCopy(viewState)
  const actionLabel = viewActionLabel(viewState)

  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Card className="border-primary/15 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <AnimatePresence mode="wait" initial={false}>
                  {viewState === "active" ? (
                    <motion.span
                      key="active-icon"
                      initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.6, rotate: reduceMotion ? 0 : -30 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.6 }}
                      transition={{ duration: reduceMotion ? 0.01 : 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="flex items-center justify-center"
                    >
                      <ShieldCheck className="w-5 h-5 text-primary" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle-icon"
                      initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.6 }}
                      transition={{ duration: reduceMotion ? 0.01 : 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="flex items-center justify-center"
                    >
                      <Landmark className="w-5 h-5 text-primary" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-ink">{copy.title}</h2>
                <p className="text-sm text-muted">{copy.subtitle}</p>
              </div>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              {viewState !== "connect" && (
                <motion.div
                  key={viewState}
                  initial={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                  transition={{ duration: reduceMotion ? 0.01 : 0.25 }}
                >
                  <Badge variant={viewState === "active" ? "success" : "warning"}>
                    {viewState === "active" ? "Active" : "In progress"}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardHeader>

        <CardContent className="py-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={viewState}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : -10 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="space-y-6"
            >
              {viewState === "connect" && (
                <p className="text-sm text-muted leading-relaxed">
                  You keep <span className="font-bold text-accent">100%</span> of your menu price. Vision Menu
                  collects each payment and settles your earnings straight to your connected account.
                </p>
              )}

              {viewState === "incomplete" && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/5 border border-warning/20">
                  <Clock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <p className="text-sm text-warning leading-relaxed">
                    Stripe needs a little more information before your payouts can go live.
                  </p>
                </div>
              )}

              {viewState === "active" && (
                <>
                  <p className="text-sm text-muted leading-relaxed">
                    You keep <span className="font-bold text-accent">100%</span> of your menu price — Vision Menu
                    settles your earnings straight to your connected account.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <StatusChip label="Charges enabled" active={data.chargesEnabled} index={0} />
                    <StatusChip label="Payouts enabled" active={data.payoutsEnabled} index={1} />
                    <StatusChip label="Details submitted" active={data.detailsSubmitted} index={2} />
                  </div>
                </>
              )}

              <Button
                type="button"
                variant={viewState === "active" ? "outline" : "primary"}
                size={viewState === "connect" ? "lg" : viewState === "active" ? "sm" : "md"}
                loading={connectMutation.isPending || redirecting}
                disabled={connectMutation.isPending || redirecting}
                onClick={() => connectMutation.mutate()}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {redirecting ? (
                    <motion.span
                      key="redirecting"
                      initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
                      transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
                      className="inline-flex items-center gap-2"
                    >
                      Redirecting to Stripe…
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
                      transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
                      className="inline-flex items-center gap-2"
                    >
                      {actionLabel}
                      <ArrowUpRight className="w-4 h-4" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}
