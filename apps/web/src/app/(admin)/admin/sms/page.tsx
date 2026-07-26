"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Shield,
  MessageSquareText,
  Search,
  AlertTriangle,
  Store,
  Save,
  Check,
} from "lucide-react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ToggleSwitch } from "@/components/admin/fee-config-card"
import { useAuthStore } from "@/stores/auth"
import api from "@/lib/api"
import { toast } from "sonner"
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe"

interface SmsSettingsResponse {
  enabled: boolean
  baseCostPerSegment: number
  defaultMarginPercent: number
  currency: string
}

interface SmsSettingsPayload {
  enabled: boolean
  baseCostPerSegment: number
  defaultMarginPercent: number
}

interface SmsSettingsFormState {
  enabled: boolean
  baseCostPerSegment: string
  defaultMarginPercent: string
}

interface RestaurantSmsRow {
  id: string
  name: string
  slug: string
  smsEnabled: boolean
  smsMarginPercent: number
  smsSent: number
  totalSellAmount: number
  totalMarginAmount: number
}

interface RestaurantSmsResponse {
  restaurants: RestaurantSmsRow[]
}

interface SmsConfigPayload {
  smsEnabled?: boolean
  smsMarginPercent?: number
}

interface SmsConfigVariables {
  restaurantId: string
  payload: SmsConfigPayload
}

function formatMoney(value: number) {
  return `₹${value.toFixed(2)}`
}

function toNumber(value: string): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function clampPercent(value: number): number {
  return Math.min(1000, Math.max(0, value))
}

function normalizeSettings(settings: SmsSettingsResponse): SmsSettingsFormState {
  return {
    enabled: settings.enabled,
    baseCostPerSegment: String(settings.baseCostPerSegment),
    defaultMarginPercent: String(settings.defaultMarginPercent),
  }
}

function MarginField({
  value,
  saving,
  onSave,
}: {
  value: number
  saving: boolean
  onSave: (next: number) => void
}) {
  const [draft, setDraft] = useState(String(value))

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const isDirty = clampPercent(toNumber(draft)) !== value

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-24">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          max={1000}
          step="0.01"
          value={draft}
          disabled={saving}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full rounded-lg border border-line bg-surface py-1.5 pl-3 pr-7 text-sm text-ink transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20 disabled:opacity-50"
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted">
          %
        </span>
      </div>
      <AnimatePresence initial={false}>
        {isDirty && (
          <motion.button
            key="save-margin"
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            disabled={saving}
            onClick={() => onSave(clampPercent(toNumber(draft)))}
            title="Save margin"
            className="shrink-0 rounded-lg bg-primary/10 p-1.5 text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function SuperAdminSmsPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const reduceMotion = useReducedMotionSafe()
  const isSuperAdmin = Boolean(user?.isSuperAdmin)
  const [search, setSearch] = useState("")

  const [form, setForm] = useState<SmsSettingsFormState>({
    enabled: false,
    baseCostPerSegment: "0",
    defaultMarginPercent: "0",
  })
  const [savedSnapshot, setSavedSnapshot] = useState<SmsSettingsFormState>(form)
  const [justSaved, setJustSaved] = useState(false)
  const initializedRef = useRef(false)
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const settingsQuery = useQuery<SmsSettingsResponse>({
    queryKey: ["sms-settings"],
    queryFn: () => api.get("/api/v1/admin/sms-settings").then((r) => r.data.data),
    enabled: isSuperAdmin,
  })

  useEffect(() => {
    if (settingsQuery.data && !initializedRef.current) {
      const normalized = normalizeSettings(settingsQuery.data)
      setForm(normalized)
      setSavedSnapshot(normalized)
      initializedRef.current = true
    }
  }, [settingsQuery.data])

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
    }
  }, [])

  const settingsMutation = useMutation({
    mutationFn: (payload: SmsSettingsPayload) =>
      api.put("/api/v1/admin/sms-settings", payload).then((r) => r.data.data as SmsSettingsResponse),
    onSuccess: (data) => {
      queryClient.setQueryData(["sms-settings"], data)
      const normalized = normalizeSettings(data)
      setForm(normalized)
      setSavedSnapshot(normalized)
      setJustSaved(true)
      toast.success("SMS settings updated")
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
      savedTimeoutRef.current = setTimeout(() => setJustSaved(false), 2200)
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to update SMS settings"),
  })

  const settingsDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedSnapshot),
    [form, savedSnapshot]
  )

  function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    settingsMutation.mutate({
      enabled: form.enabled,
      baseCostPerSegment: clampPercent(toNumber(form.baseCostPerSegment)),
      defaultMarginPercent: clampPercent(toNumber(form.defaultMarginPercent)),
    })
  }

  const configQuery = useQuery<RestaurantSmsResponse>({
    queryKey: ["sms-config"],
    queryFn: () => api.get("/api/v1/admin/sms-config").then((r) => r.data.data),
    enabled: isSuperAdmin,
  })

  const configMutation = useMutation<
    { smsEnabled: boolean; smsMarginPercent: number },
    unknown,
    SmsConfigVariables,
    { previous?: RestaurantSmsResponse }
  >({
    mutationFn: ({ restaurantId, payload }) =>
      api.put(`/api/v1/admin/sms-config/${restaurantId}`, payload).then((r) => r.data.data),
    onMutate: async ({ restaurantId, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["sms-config"] })
      const previous = queryClient.getQueryData<RestaurantSmsResponse>(["sms-config"])
      queryClient.setQueryData<RestaurantSmsResponse>(["sms-config"], (old) => {
        if (!old) return old
        return {
          restaurants: old.restaurants.map((r) =>
            r.id === restaurantId ? { ...r, ...payload } : r
          ),
        }
      })
      return { previous }
    },
    onError: (err: any, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["sms-config"], context.previous)
      toast.error(err.response?.data?.error || "Failed to update SMS config")
    },
    onSuccess: () => toast.success("SMS config updated"),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sms-config"] })
    },
  })

  const pendingVariables = configMutation.isPending ? configMutation.variables : undefined

  const filteredRestaurants = useMemo(() => {
    const rows = configQuery.data?.restaurants ?? []
    const query = search.trim().toLowerCase()
    if (!query) return rows
    return rows.filter(
      (r) => r.name.toLowerCase().includes(query) || r.slug.toLowerCase().includes(query)
    )
  }, [configQuery.data, search])

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

  return (
    <div className="max-w-5xl mx-auto pb-16">
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.4 }}
        className="mb-8"
      >
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Platform Overview
        </Link>
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageSquareText className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-extrabold text-ink">SMS Notifications</h1>
        </div>
        <p className="text-muted text-sm max-w-2xl">
          Control SMS platform-wide, then fine-tune which restaurants have it on and what
          margin they&apos;re charged above your base cost.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.4, delay: reduceMotion ? 0 : 0.05 }}
        className="mb-8"
      >
        {settingsQuery.isLoading && (
          <div className="h-56 rounded-xl bg-surface-elevated animate-pulse" />
        )}

        {settingsQuery.isError && (
          <Card className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <AlertTriangle className="w-10 h-10 text-danger/40" />
            <p className="text-sm font-semibold text-ink">Couldn&apos;t load SMS settings</p>
            <Button variant="outline" size="sm" onClick={() => settingsQuery.refetch()}>
              Try again
            </Button>
          </Card>
        )}

        {!settingsQuery.isLoading && !settingsQuery.isError && (
          <Card className="overflow-hidden">
            <CardHeader className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageSquareText className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-ink">Global SMS settings</h2>
                  <p className="text-xs text-muted">
                    Applies platform-wide before any per-restaurant override
                  </p>
                </div>
              </div>
              <ToggleSwitch
                checked={form.enabled}
                onChange={(v) => setForm((f) => ({ ...f, enabled: v }))}
                ariaLabel="Toggle SMS notifications platform-wide"
              />
            </CardHeader>
            <form onSubmit={handleSaveSettings}>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="baseCostPerSegment" className="block text-sm font-medium text-ink">
                      Base cost per segment
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">
                        ₹
                      </span>
                      <input
                        id="baseCostPerSegment"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={1000}
                        step="0.0001"
                        value={form.baseCostPerSegment}
                        onChange={(e) => setForm((f) => ({ ...f, baseCostPerSegment: e.target.value }))}
                        className="w-full rounded-xl border border-line bg-surface py-3 pl-8 pr-4 text-base text-ink transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="defaultMarginPercent" className="block text-sm font-medium text-ink">
                      Default margin
                    </label>
                    <div className="relative">
                      <input
                        id="defaultMarginPercent"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={1000}
                        step="0.01"
                        value={form.defaultMarginPercent}
                        onChange={(e) => setForm((f) => ({ ...f, defaultMarginPercent: e.target.value }))}
                        className="w-full rounded-xl border border-line bg-surface py-3 pl-4 pr-9 text-base text-ink transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">
                        %
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted mt-3">
                  New restaurants inherit this margin until you set an override below.
                </p>
              </CardContent>
              <div className="flex items-center justify-end gap-3 border-t border-line px-6 py-4">
                <AnimatePresence mode="wait" initial={false}>
                  {settingsDirty && (
                    <motion.span
                      key="dirty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs font-semibold text-accent"
                    >
                      Unsaved changes
                    </motion.span>
                  )}
                </AnimatePresence>
                <Button
                  type="submit"
                  loading={settingsMutation.isPending}
                  disabled={settingsMutation.isPending || !settingsDirty}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {justSaved && !settingsDirty ? (
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
            </form>
          </Card>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.4, delay: reduceMotion ? 0 : 0.1 }}
        className="relative mb-5 max-w-sm"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Search by restaurant or slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-line bg-surface text-sm text-ink placeholder:text-muted focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-colors"
        />
      </motion.div>

      {configQuery.isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-surface-elevated animate-pulse" />
          ))}
        </div>
      )}

      {configQuery.isError && (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <AlertTriangle className="w-12 h-12 text-danger/40 mb-4" />
          <h2 className="text-lg font-bold text-ink">Couldn&apos;t load SMS config</h2>
          <p className="text-muted text-sm mt-1 mb-5">
            Something went wrong while fetching per-restaurant SMS settings.
          </p>
          <Button variant="outline" onClick={() => configQuery.refetch()}>
            Try again
          </Button>
        </div>
      )}

      {!configQuery.isLoading && !configQuery.isError && filteredRestaurants.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 border border-dashed border-line rounded-2xl"
        >
          <Store className="w-12 h-12 text-muted/30 mx-auto mb-3" />
          <p className="text-muted font-medium">
            {search ? "No restaurants match your search" : "No restaurants yet"}
          </p>
        </motion.div>
      )}

      {!configQuery.isLoading && !configQuery.isError && filteredRestaurants.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.4, delay: reduceMotion ? 0 : 0.15 }}
        >
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted border-b border-line">
                    <th className="py-3 px-5 font-bold">Restaurant</th>
                    <th className="py-3 px-4 font-bold">Enabled</th>
                    <th className="py-3 px-4 font-bold">Margin</th>
                    <th className="py-3 px-4 font-bold">SMS sent</th>
                    <th className="py-3 px-4 font-bold">Billed to owner</th>
                    <th className="py-3 px-5 font-bold">Platform margin</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {filteredRestaurants.map((row, idx) => {
                      const pending = pendingVariables?.restaurantId === row.id
                      return (
                        <motion.tr
                          key={row.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: reduceMotion ? 0.01 : 0.25,
                            delay: reduceMotion ? 0 : idx * 0.03,
                          }}
                          className="border-b border-line/50 last:border-0 align-middle hover:bg-surface-elevated/50 transition-colors"
                        >
                          <td className="py-4 px-5">
                            <p className="font-bold text-ink">{row.name}</p>
                            <p className="text-xs text-muted">/{row.slug}</p>
                          </td>
                          <td className="py-4 px-4">
                            <ToggleSwitch
                              checked={row.smsEnabled}
                              disabled={pending}
                              ariaLabel={`Toggle SMS for ${row.name}`}
                              onChange={(next) =>
                                configMutation.mutate({
                                  restaurantId: row.id,
                                  payload: { smsEnabled: next },
                                })
                              }
                            />
                          </td>
                          <td className="py-4 px-4">
                            <MarginField
                              value={row.smsMarginPercent}
                              saving={pending}
                              onSave={(next) =>
                                configMutation.mutate({
                                  restaurantId: row.id,
                                  payload: { smsMarginPercent: next },
                                })
                              }
                            />
                          </td>
                          <td className="py-4 px-4 text-ink font-semibold">{row.smsSent}</td>
                          <td className="py-4 px-4 text-ink font-semibold">
                            {formatMoney(row.totalSellAmount)}
                          </td>
                          <td className="py-4 px-5 text-accent font-semibold">
                            {formatMoney(row.totalMarginAmount)}
                          </td>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
