"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Coins, Truck, Receipt, Save, Check, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  FeeConfigCard,
  type FeeMode,
  type FeeBeneficiary,
} from "@/components/admin/fee-config-card"
import { DeliveryExemptionsCard } from "@/components/admin/delivery-exemptions-card"
import api from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe"

interface RestaurantOption {
  id: string
  name: string
}

interface FeeConfigResponse {
  deliveryFeeEnabled: boolean
  deliveryFeeMode: FeeMode
  deliveryFeeAmount: number
  deliveryFeeBeneficiary: FeeBeneficiary
  convenienceFeeEnabled: boolean
  convenienceFeeMode: FeeMode
  convenienceFeeAmount: number
  convenienceFeeBeneficiary: FeeBeneficiary
}

interface FeeConfigPayload {
  deliveryFeeEnabled: boolean
  deliveryFeeMode: FeeMode
  deliveryFeeAmount: number
  convenienceFeeEnabled: boolean
  convenienceFeeMode: FeeMode
  convenienceFeeAmount: number
}

interface FeeFormState {
  deliveryFeeEnabled: boolean
  deliveryFeeMode: FeeMode
  deliveryFeeAmount: string
  convenienceFeeEnabled: boolean
  convenienceFeeMode: FeeMode
  convenienceFeeAmount: string
}

const emptyFormState: FeeFormState = {
  deliveryFeeEnabled: false,
  deliveryFeeMode: "FLAT",
  deliveryFeeAmount: "0",
  convenienceFeeEnabled: false,
  convenienceFeeMode: "FLAT",
  convenienceFeeAmount: "0",
}

function toNumber(value: string): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function clampFee(value: number): number {
  return Math.min(100000, Math.max(0, value))
}

function normalizeConfig(config: FeeConfigResponse): FeeFormState {
  return {
    deliveryFeeEnabled: config.deliveryFeeEnabled,
    deliveryFeeMode: config.deliveryFeeMode,
    deliveryFeeAmount: String(toNumber(String(config.deliveryFeeAmount))),
    convenienceFeeEnabled: config.convenienceFeeEnabled,
    convenienceFeeMode: config.convenienceFeeMode,
    convenienceFeeAmount: String(toNumber(String(config.convenienceFeeAmount))),
  }
}

export default function FeesPage() {
  const queryClient = useQueryClient()
  const reduceMotion = useReducedMotionSafe()
  const [restaurantId, setRestaurantId] = useState<string>("")
  const [form, setForm] = useState<FeeFormState>(emptyFormState)
  const [savedSnapshot, setSavedSnapshot] = useState<FeeFormState>(emptyFormState)
  const [justSaved, setJustSaved] = useState(false)
  const initializedForRef = useRef<string | null>(null)
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: restaurants } = useQuery<RestaurantOption[]>({
    queryKey: ["restaurants"],
    queryFn: () => api.get("/api/v1/restaurants").then((r) => r.data.data),
  })

  useEffect(() => {
    if (restaurants?.[0] && !restaurantId) {
      setRestaurantId(restaurants[0].id)
    }
  }, [restaurants, restaurantId])

  const configQuery = useQuery<FeeConfigResponse>({
    queryKey: ["fee-config", restaurantId],
    queryFn: () =>
      api.get(`/api/v1/restaurants/${restaurantId}/fee-config`).then((r) => r.data.data),
    enabled: !!restaurantId,
  })

  useEffect(() => {
    if (configQuery.data && initializedForRef.current !== restaurantId) {
      const normalized = normalizeConfig(configQuery.data)
      setForm(normalized)
      setSavedSnapshot(normalized)
      initializedForRef.current = restaurantId
    }
  }, [configQuery.data, restaurantId])

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
    }
  }, [])

  const configMutation = useMutation({
    mutationFn: (payload: FeeConfigPayload) =>
      api
        .put(`/api/v1/restaurants/${restaurantId}/fee-config`, payload)
        .then((r) => r.data.data as FeeConfigResponse),
    onSuccess: (data) => {
      queryClient.setQueryData(["fee-config", restaurantId], data)
      const normalized = normalizeConfig(data)
      setForm(normalized)
      setSavedSnapshot(normalized)
      setJustSaved(true)
      toast.success("Fees updated")
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
      savedTimeoutRef.current = setTimeout(() => setJustSaved(false), 2200)
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to update fees"),
  })

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedSnapshot),
    [form, savedSnapshot]
  )
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
    })
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.4 }}
        className="flex items-start justify-between gap-6 mb-8"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
              <Coins className="w-5 h-5 text-brand-red" />
            </div>
            <h1 className="text-3xl font-extrabold text-ink">Delivery &amp; Convenience Fees</h1>
          </div>
          <p className="text-muted max-w-xl">
            Extra charges added to delivery orders. Shown to customers as a single
            &ldquo;Delivery &amp; handling&rdquo; line.
          </p>
        </div>
        {restaurants && restaurants.length > 1 && (
          <select
            value={restaurantId}
            onChange={(e) => setRestaurantId(e.target.value)}
            className="px-4 py-3 rounded-xl border border-line text-sm focus:outline-none focus:border-brand-red"
          >
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        )}
      </motion.div>

      {configQuery.isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-72 rounded-xl bg-surface-elevated animate-pulse" />
          <div className="h-72 rounded-xl bg-surface-elevated animate-pulse" />
        </div>
      )}

      {configQuery.isError && (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <AlertTriangle className="w-12 h-12 text-danger/40 mb-4" />
          <h2 className="text-lg font-bold text-ink">Couldn&apos;t load your fee settings</h2>
          <p className="text-muted text-sm mt-1 mb-5">
            Something went wrong while fetching your fee configuration.
          </p>
          <Button variant="outline" onClick={() => configQuery.refetch()}>
            Try again
          </Button>
        </div>
      )}

      {!configQuery.isLoading && !configQuery.isError && configQuery.data && (
        <>
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <FeeConfigCard
              id="delivery"
              icon={Truck}
              title="Delivery fee"
              description="Charged to diners on your delivery orders"
              enabled={form.deliveryFeeEnabled}
              onEnabledChange={(v) => setForm((f) => ({ ...f, deliveryFeeEnabled: v }))}
              mode={form.deliveryFeeMode}
              onModeChange={(m) => setForm((f) => ({ ...f, deliveryFeeMode: m }))}
              amount={form.deliveryFeeAmount}
              onAmountChange={(v) => setForm((f) => ({ ...f, deliveryFeeAmount: v }))}
              beneficiary={configQuery.data.deliveryFeeBeneficiary}
              index={0}
            />
            <FeeConfigCard
              id="convenience"
              icon={Receipt}
              title="Convenience fee"
              description="A service charge on your delivery orders"
              enabled={form.convenienceFeeEnabled}
              onEnabledChange={(v) => setForm((f) => ({ ...f, convenienceFeeEnabled: v }))}
              mode={form.convenienceFeeMode}
              onModeChange={(m) => setForm((f) => ({ ...f, convenienceFeeMode: m }))}
              amount={form.convenienceFeeAmount}
              onAmountChange={(v) => setForm((f) => ({ ...f, convenienceFeeAmount: v }))}
              beneficiary={configQuery.data.convenienceFeeBeneficiary}
              index={1}
            />
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
                    disabled={configMutation.isPending || !isDirty}
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
        <DeliveryExemptionsCard restaurantId={restaurantId} />
        </>
      )}
    </div>
  )
}
