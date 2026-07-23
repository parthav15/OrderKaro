"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Shield,
  Coins,
  Truck,
  Receipt,
  SlidersHorizontal,
  Calculator,
  Save,
  Check,
  Info,
  AlertTriangle,
} from "lucide-react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FeeConfigCard, ToggleSwitch, AnimatedAmount, type FeeMode } from "@/components/admin/fee-config-card"
import { useAuthStore } from "@/stores/auth"
import api from "@/lib/api"
import { toast } from "sonner"
import { cn, getTimeSince } from "@/lib/utils"
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe"

const SUPER_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "admin@orderkaro.com"

const EXAMPLE_SUBTOTAL = 500

interface PlatformConfigResponse {
  id: string
  deliveryFeeEnabled: boolean
  deliveryFeeMode: FeeMode
  deliveryFeeAmount: number | string
  convenienceFeeEnabled: boolean
  convenienceFeeMode: FeeMode
  convenienceFeeAmount: number | string
  minFee: number | string
  maxFee: number | string | null
  updatedAt: string
}

interface PlatformConfigPayload {
  deliveryFeeEnabled: boolean
  deliveryFeeMode: FeeMode
  deliveryFeeAmount: number
  convenienceFeeEnabled: boolean
  convenienceFeeMode: FeeMode
  convenienceFeeAmount: number
  minFee: number
  maxFee: number | null
}

interface FeeFormState {
  deliveryFeeEnabled: boolean
  deliveryFeeMode: FeeMode
  deliveryFeeAmount: string
  convenienceFeeEnabled: boolean
  convenienceFeeMode: FeeMode
  convenienceFeeAmount: string
  minFee: string
  maxFeeEnabled: boolean
  maxFee: string
}

const emptyFormState: FeeFormState = {
  deliveryFeeEnabled: false,
  deliveryFeeMode: "FLAT",
  deliveryFeeAmount: "0",
  convenienceFeeEnabled: false,
  convenienceFeeMode: "FLAT",
  convenienceFeeAmount: "0",
  minFee: "0",
  maxFeeEnabled: false,
  maxFee: "",
}

function toNumber(value: number | string): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function clampFee(value: number): number {
  return Math.min(100000, Math.max(0, value))
}

function normalizeConfig(config: PlatformConfigResponse): FeeFormState {
  const hasMax = config.maxFee !== null && config.maxFee !== undefined
  return {
    deliveryFeeEnabled: config.deliveryFeeEnabled,
    deliveryFeeMode: config.deliveryFeeMode,
    deliveryFeeAmount: String(toNumber(config.deliveryFeeAmount)),
    convenienceFeeEnabled: config.convenienceFeeEnabled,
    convenienceFeeMode: config.convenienceFeeMode,
    convenienceFeeAmount: String(toNumber(config.convenienceFeeAmount)),
    minFee: String(toNumber(config.minFee)),
    maxFeeEnabled: hasMax,
    maxFee: hasMax ? String(toNumber(config.maxFee as number | string)) : "",
  }
}

interface ExampleFees {
  deliveryRaw: number
  convenienceRaw: number
  finalTotal: number
  clampedByMin: boolean
  clampedByMax: boolean
}

function computeExampleFees(form: FeeFormState): ExampleFees {
  const deliveryRaw = form.deliveryFeeEnabled
    ? form.deliveryFeeMode === "PERCENT"
      ? (EXAMPLE_SUBTOTAL * toNumber(form.deliveryFeeAmount)) / 100
      : toNumber(form.deliveryFeeAmount)
    : 0
  const convenienceRaw = form.convenienceFeeEnabled
    ? form.convenienceFeeMode === "PERCENT"
      ? (EXAMPLE_SUBTOTAL * toNumber(form.convenienceFeeAmount)) / 100
      : toNumber(form.convenienceFeeAmount)
    : 0

  const anyFeeEnabled = form.deliveryFeeEnabled || form.convenienceFeeEnabled
  const rawTotal = deliveryRaw + convenienceRaw
  const minFee = toNumber(form.minFee)
  const maxFee = form.maxFeeEnabled && form.maxFee.trim() !== "" ? toNumber(form.maxFee) : null

  let finalTotal = rawTotal
  if (anyFeeEnabled) {
    finalTotal = Math.max(finalTotal, minFee)
    if (maxFee !== null) finalTotal = Math.min(finalTotal, maxFee)
  }

  return {
    deliveryRaw,
    convenienceRaw,
    finalTotal,
    clampedByMin: anyFeeEnabled && rawTotal < minFee,
    clampedByMax: anyFeeEnabled && maxFee !== null && rawTotal > maxFee,
  }
}

function RupeeField({
  id,
  value,
  onChange,
  label,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  label: string
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">
          ₹
        </span>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          max={100000}
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-line bg-surface py-3 pl-8 pr-4 text-base text-ink placeholder:text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </div>
  )
}

function FeeRow({ label, value, enabled }: { label: string; value: number; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted">{label}</span>
      {enabled ? (
        <AnimatedAmount value={value} className="text-sm font-semibold text-ink" />
      ) : (
        <span className="text-sm font-medium text-muted">Off</span>
      )}
    </div>
  )
}

export default function SuperAdminFeesPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const reduceMotion = useReducedMotionSafe()
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL

  const [form, setForm] = useState<FeeFormState>(emptyFormState)
  const [savedSnapshot, setSavedSnapshot] = useState<FeeFormState>(emptyFormState)
  const [justSaved, setJustSaved] = useState(false)
  const initializedRef = useRef(false)
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const configQuery = useQuery<PlatformConfigResponse>({
    queryKey: ["platform-config"],
    queryFn: () => api.get("/api/v1/admin/platform-config").then((r) => r.data.data),
    enabled: isSuperAdmin,
  })

  useEffect(() => {
    if (configQuery.data && !initializedRef.current) {
      const normalized = normalizeConfig(configQuery.data)
      setForm(normalized)
      setSavedSnapshot(normalized)
      initializedRef.current = true
    }
  }, [configQuery.data])

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
    }
  }, [])

  const configMutation = useMutation({
    mutationFn: (payload: PlatformConfigPayload) =>
      api
        .put("/api/v1/admin/platform-config", payload)
        .then((r) => r.data.data as PlatformConfigResponse),
    onSuccess: (data) => {
      queryClient.setQueryData(["platform-config"], data)
      const normalized = normalizeConfig(data)
      setForm(normalized)
      setSavedSnapshot(normalized)
      setJustSaved(true)
      toast.success("Marketplace fees updated")
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
      savedTimeoutRef.current = setTimeout(() => setJustSaved(false), 2200)
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Failed to update fee configuration"),
  })

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedSnapshot),
    [form, savedSnapshot]
  )

  const example = useMemo(() => computeExampleFees(form), [form])
  const maxFeeMissing = form.maxFeeEnabled && form.maxFee.trim() === ""
  const maxBelowMin =
    form.maxFeeEnabled && !maxFeeMissing && toNumber(form.maxFee) < toNumber(form.minFee)
  const showBar = isDirty || configMutation.isPending || justSaved

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    configMutation.mutate({
      deliveryFeeEnabled: form.deliveryFeeEnabled,
      deliveryFeeMode: form.deliveryFeeMode,
      deliveryFeeAmount: clampFee(toNumber(form.deliveryFeeAmount)),
      convenienceFeeEnabled: form.convenienceFeeEnabled,
      convenienceFeeMode: form.convenienceFeeMode,
      convenienceFeeAmount: clampFee(toNumber(form.convenienceFeeAmount)),
      minFee: clampFee(toNumber(form.minFee)),
      maxFee: form.maxFeeEnabled ? clampFee(toNumber(form.maxFee)) : null,
    })
  }

  if (!isSuperAdmin) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-32"
      >
        <Shield className="w-16 h-16 text-muted/30 mb-4" />
        <h2 className="text-xl font-bold text-ink">Access Denied</h2>
        <p className="text-muted mt-2 text-sm">
          This area is restricted to the super admin only.
        </p>
      </motion.div>
    )
  }

  if (configQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <AlertTriangle className="w-12 h-12 text-danger/40 mb-4" />
        <h2 className="text-lg font-bold text-ink">Couldn&apos;t load fee configuration</h2>
        <p className="text-muted text-sm mt-1 mb-5">
          Something went wrong while fetching the platform config.
        </p>
        <Button variant="outline" onClick={() => configQuery.refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.4 }}
        className="mb-8"
      >
        <Link
          href="/admin/super"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Super Admin
        </Link>
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Coins className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-extrabold text-ink">Marketplace Fees</h1>
          <Badge variant="editorial">Delivery orders only</Badge>
        </div>
        <p className="text-muted text-sm">
          Configure the platform&apos;s delivery and convenience fees — the platform&apos;s margin
          on every delivery order, across all restaurants.
        </p>
        {configQuery.data && (
          <p className="text-xs text-muted mt-2">
            Last saved {getTimeSince(configQuery.data.updatedAt)}
          </p>
        )}
      </motion.div>

      {configQuery.isLoading ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="h-72 rounded-xl bg-surface-elevated animate-pulse" />
            <div className="h-72 rounded-xl bg-surface-elevated animate-pulse" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="h-64 rounded-xl bg-surface-elevated animate-pulse" />
            <div className="h-64 rounded-xl bg-surface-elevated animate-pulse" />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <FeeConfigCard
              id="delivery"
              icon={Truck}
              title="Delivery fee"
              description="Charged to diners on every delivery order"
              enabled={form.deliveryFeeEnabled}
              onEnabledChange={(v) => setForm((f) => ({ ...f, deliveryFeeEnabled: v }))}
              mode={form.deliveryFeeMode}
              onModeChange={(m) => setForm((f) => ({ ...f, deliveryFeeMode: m }))}
              amount={form.deliveryFeeAmount}
              onAmountChange={(v) => setForm((f) => ({ ...f, deliveryFeeAmount: v }))}
              index={0}
            />
            <FeeConfigCard
              id="convenience"
              icon={Receipt}
              title="Convenience fee"
              description="Platform service charge on delivery orders"
              enabled={form.convenienceFeeEnabled}
              onEnabledChange={(v) => setForm((f) => ({ ...f, convenienceFeeEnabled: v }))}
              mode={form.convenienceFeeMode}
              onModeChange={(m) => setForm((f) => ({ ...f, convenienceFeeMode: m }))}
              amount={form.convenienceFeeAmount}
              onAmountChange={(v) => setForm((f) => ({ ...f, convenienceFeeAmount: v }))}
              index={1}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <motion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.45, delay: reduceMotion ? 0 : 0.16 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-surface-elevated flex items-center justify-center">
                      <SlidersHorizontal className="w-5 h-5 text-muted" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-ink">Fee limits</h2>
                      <p className="text-sm text-muted">Guardrails on the combined fee per order</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-1.5">
                    <RupeeField
                      id="minFee"
                      value={form.minFee}
                      onChange={(v) => setForm((f) => ({ ...f, minFee: v }))}
                      label="Minimum fee"
                    />
                    <p className="text-xs text-muted">
                      The combined fee never drops below this amount
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <div>
                      <p className="text-sm font-medium text-ink">Cap the maximum fee</p>
                      <p className="text-xs text-muted">Optional ceiling on the combined fee</p>
                    </div>
                    <ToggleSwitch
                      checked={form.maxFeeEnabled}
                      onChange={(v) => setForm((f) => ({ ...f, maxFeeEnabled: v }))}
                      ariaLabel="Toggle maximum fee cap"
                    />
                  </div>

                  <AnimatePresence initial={false}>
                    {form.maxFeeEnabled && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: reduceMotion ? 0.01 : 0.3 }}
                        className="overflow-hidden space-y-2"
                      >
                        <RupeeField
                          id="maxFee"
                          value={form.maxFee}
                          onChange={(v) => setForm((f) => ({ ...f, maxFee: v }))}
                          label="Maximum fee"
                        />
                        {maxFeeMissing && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-1.5 text-xs font-medium text-danger"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            Enter a maximum fee, or turn off the cap
                          </motion.p>
                        )}
                        {maxBelowMin && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-1.5 text-xs font-medium text-danger"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            Maximum fee should be at least the minimum fee
                          </motion.p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.45, delay: reduceMotion ? 0 : 0.22 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-surface-elevated flex items-center justify-center">
                      <Calculator className="w-5 h-5 text-muted" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-ink">Live preview</h2>
                      <p className="text-sm text-muted">What the platform earns on a sample order</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border border-line/70 bg-surface-elevated/60 p-5">
                    <div className="flex items-center justify-between text-sm text-muted">
                      <span>Sample delivery order</span>
                      <span className="font-semibold text-ink">₹{EXAMPLE_SUBTOTAL.toFixed(2)}</span>
                    </div>

                    <div className="my-3 border-t border-dashed border-line" />

                    <FeeRow label="Delivery fee" value={example.deliveryRaw} enabled={form.deliveryFeeEnabled} />
                    <FeeRow
                      label="Convenience fee"
                      value={example.convenienceRaw}
                      enabled={form.convenienceFeeEnabled}
                    />

                    <div className="my-3 border-t border-line" />

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-ink">Platform earns</span>
                      <AnimatedAmount
                        value={example.finalTotal}
                        className="text-2xl font-extrabold text-primary"
                      />
                    </div>

                    <AnimatePresence>
                      {(example.clampedByMin || example.clampedByMax) && (
                        <motion.p
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: "auto", marginTop: 10 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          className="overflow-hidden flex items-center gap-1.5 text-xs font-medium text-accent"
                        >
                          <Info className="w-3.5 h-3.5 shrink-0" />
                          {example.clampedByMin
                            ? `Raised to your minimum fee of ₹${toNumber(form.minFee).toFixed(2)}`
                            : `Capped at your maximum fee of ₹${toNumber(form.maxFee).toFixed(2)}`}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <AnimatePresence>
            {showBar && (
              <motion.div
                initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
                transition={
                  reduceMotion ? { duration: 0.01 } : { type: "spring", stiffness: 380, damping: 34 }
                }
                className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-6 pointer-events-none"
              >
                <div className="pointer-events-auto flex items-center gap-4 rounded-2xl border border-line/60 bg-surface/95 backdrop-blur-xl px-5 py-3 shadow-lg shadow-black/[0.08]">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        isDirty ? "bg-accent animate-pulse" : "bg-success"
                      )}
                    />
                    <span className="text-sm font-semibold text-ink whitespace-nowrap">
                      {isDirty ? "Unsaved changes" : "All changes saved"}
                    </span>
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    loading={configMutation.isPending}
                    disabled={configMutation.isPending || !isDirty || maxFeeMissing}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {justSaved && !isDirty ? (
                        <motion.span
                          key="saved"
                          initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
                          transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
                          className="inline-flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" /> Saved
                        </motion.span>
                      ) : (
                        <motion.span
                          key="save"
                          initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
                          transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
                          className="inline-flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" /> Save changes
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      )}
    </div>
  )
}
