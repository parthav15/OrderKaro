"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Shield,
  Coins,
  Search,
  Info,
  AlertTriangle,
  Truck,
  Receipt,
  Store,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/auth"
import api from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe"

type FeeMode = "FLAT" | "PERCENT"
type FeeBeneficiary = "RESTAURANT" | "PLATFORM"
type CollectionMode = "BYO" | "MARKETPLACE"
type FeeField = "delivery" | "convenience"

interface RestaurantFeeRow {
  id: string
  name: string
  country: string
  collectionMode: CollectionMode
  deliveryFeeEnabled: boolean
  deliveryFeeMode: FeeMode
  deliveryFeeAmount: number
  deliveryFeeBeneficiary: FeeBeneficiary
  convenienceFeeEnabled: boolean
  convenienceFeeMode: FeeMode
  convenienceFeeAmount: number
  convenienceFeeBeneficiary: FeeBeneficiary
}

interface RestaurantFeesResponse {
  restaurants: RestaurantFeeRow[]
}

interface BeneficiaryPayload {
  deliveryFeeBeneficiary: FeeBeneficiary
  convenienceFeeBeneficiary: FeeBeneficiary
}

interface ToggleVariables {
  restaurantId: string
  field: FeeField
  payload: BeneficiaryPayload
}

function formatFeeAmount(mode: FeeMode, amount: number) {
  return mode === "PERCENT" ? `${amount}%` : `₹${amount.toFixed(2)}`
}

function BeneficiaryToggle({
  layoutId,
  value,
  onChange,
  disabled,
}: {
  layoutId: string
  value: FeeBeneficiary
  onChange: (value: FeeBeneficiary) => void
  disabled?: boolean
}) {
  const reduceMotion = useReducedMotionSafe()
  const options: { value: FeeBeneficiary; label: string }[] = [
    { value: "RESTAURANT", label: "Restaurant" },
    { value: "PLATFORM", label: "Platform" },
  ]

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-line bg-surface p-0.5",
        disabled && "opacity-50 pointer-events-none"
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn(
            "relative rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors duration-200",
            value === option.value ? "text-white" : "text-muted hover:text-ink"
          )}
        >
          {value === option.value && (
            <motion.span
              layoutId={layoutId}
              className="absolute inset-0 rounded-md bg-primary"
              transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
            />
          )}
          <span className="relative z-10">{option.label}</span>
        </button>
      ))}
    </div>
  )
}

function FeeCell({
  enabled,
  mode,
  amount,
  beneficiary,
  layoutId,
  pending,
  onToggleBeneficiary,
}: {
  enabled: boolean
  mode: FeeMode
  amount: number
  beneficiary: FeeBeneficiary
  layoutId: string
  pending: boolean
  onToggleBeneficiary: (next: FeeBeneficiary) => void
}) {
  return (
    <div className={cn("space-y-2 transition-opacity duration-200", !enabled && "opacity-50")}>
      {enabled ? (
        <span className="block text-sm font-semibold text-ink">{formatFeeAmount(mode, amount)}</span>
      ) : (
        <span className="block text-sm font-medium text-muted">Off</span>
      )}
      <BeneficiaryToggle
        layoutId={layoutId}
        value={beneficiary}
        onChange={onToggleBeneficiary}
        disabled={pending}
      />
    </div>
  )
}

export default function SuperAdminFeesPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const reduceMotion = useReducedMotionSafe()
  const isSuperAdmin = Boolean(user?.isSuperAdmin)
  const [search, setSearch] = useState("")

  const feesQuery = useQuery<RestaurantFeesResponse>({
    queryKey: ["restaurant-fees"],
    queryFn: () => api.get("/api/v1/admin/restaurant-fees").then((r) => r.data.data),
    enabled: isSuperAdmin,
  })

  const beneficiaryMutation = useMutation<
    BeneficiaryPayload,
    unknown,
    ToggleVariables,
    { previous?: RestaurantFeesResponse }
  >({
    mutationFn: ({ restaurantId, payload }) =>
      api
        .put(`/api/v1/admin/restaurant-fees/${restaurantId}`, payload)
        .then((r) => r.data.data),
    onMutate: async ({ restaurantId, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["restaurant-fees"] })
      const previous = queryClient.getQueryData<RestaurantFeesResponse>(["restaurant-fees"])
      queryClient.setQueryData<RestaurantFeesResponse>(["restaurant-fees"], (old) => {
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
      if (context?.previous) queryClient.setQueryData(["restaurant-fees"], context.previous)
      toast.error(err.response?.data?.error || "Failed to update fee beneficiary")
    },
    onSuccess: () => {
      toast.success("Fee beneficiary updated")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-fees"] })
    },
  })

  const pendingVariables = beneficiaryMutation.isPending ? beneficiaryMutation.variables : undefined

  function toggleBeneficiary(row: RestaurantFeeRow, field: FeeField, next: FeeBeneficiary) {
    const payload: BeneficiaryPayload =
      field === "delivery"
        ? { deliveryFeeBeneficiary: next, convenienceFeeBeneficiary: row.convenienceFeeBeneficiary }
        : { deliveryFeeBeneficiary: row.deliveryFeeBeneficiary, convenienceFeeBeneficiary: next }
    beneficiaryMutation.mutate({ restaurantId: row.id, field, payload })
  }

  const filteredRestaurants = useMemo(() => {
    const rows = feesQuery.data?.restaurants ?? []
    const query = search.trim().toLowerCase()
    if (!query) return rows
    return rows.filter(
      (r) => r.name.toLowerCase().includes(query) || r.country.toLowerCase().includes(query)
    )
  }, [feesQuery.data, search])

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

  if (feesQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <AlertTriangle className="w-12 h-12 text-danger/40 mb-4" />
        <h2 className="text-lg font-bold text-ink">Couldn&apos;t load restaurant fees</h2>
        <p className="text-muted text-sm mt-1 mb-5">
          Something went wrong while fetching fee configuration.
        </p>
        <Button variant="outline" onClick={() => feesQuery.refetch()}>
          Try again
        </Button>
      </div>
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
            <Coins className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-extrabold text-ink">Fee Beneficiaries</h1>
          <Badge variant="editorial">Delivery orders only</Badge>
        </div>
        <p className="text-muted text-sm max-w-2xl">
          Owners set the delivery &amp; convenience fee amounts. Only you choose who actually
          collects each one &mdash; the restaurant or Vision Menu.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.4, delay: reduceMotion ? 0 : 0.05 }}
        className="flex items-start gap-3 p-4 rounded-xl bg-surface-elevated border border-line mb-6"
      >
        <Info className="w-4 h-4 text-muted shrink-0 mt-0.5" />
        <p className="text-sm text-muted leading-relaxed">
          A fee set to &ldquo;Platform&rdquo; is only actually captured on marketplace
          (platform-collected) online orders.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.4, delay: reduceMotion ? 0 : 0.08 }}
        className="relative mb-5 max-w-sm"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Search by restaurant or country..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-line bg-surface text-sm text-ink placeholder:text-muted focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-colors"
        />
      </motion.div>

      {feesQuery.isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-surface-elevated animate-pulse" />
          ))}
        </div>
      )}

      {!feesQuery.isLoading && filteredRestaurants.length === 0 && (
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

      {!feesQuery.isLoading && filteredRestaurants.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.4, delay: reduceMotion ? 0 : 0.1 }}
        >
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted border-b border-line">
                    <th className="py-3 px-5 font-bold">Restaurant</th>
                    <th className="py-3 px-4 font-bold">Country</th>
                    <th className="py-3 px-4 font-bold">Collection</th>
                    <th className="py-3 px-4 font-bold">
                      <span className="inline-flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5" /> Delivery fee
                      </span>
                    </th>
                    <th className="py-3 px-5 font-bold">
                      <span className="inline-flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5" /> Convenience fee
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {filteredRestaurants.map((row, idx) => (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: reduceMotion ? 0.01 : 0.25, delay: reduceMotion ? 0 : idx * 0.03 }}
                        className="border-b border-line/50 last:border-0 align-top hover:bg-surface-elevated/50 transition-colors"
                      >
                        <td className="py-4 px-5">
                          <p className="font-bold text-ink">{row.name}</p>
                        </td>
                        <td className="py-4 px-4 text-muted uppercase text-xs font-semibold tracking-wide">
                          {row.country}
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={row.collectionMode === "MARKETPLACE" ? "success" : "default"}>
                            {row.collectionMode === "MARKETPLACE" ? "Marketplace" : "BYO"}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <FeeCell
                            enabled={row.deliveryFeeEnabled}
                            mode={row.deliveryFeeMode}
                            amount={row.deliveryFeeAmount}
                            beneficiary={row.deliveryFeeBeneficiary}
                            layoutId={`beneficiary-pill-${row.id}-delivery`}
                            pending={
                              pendingVariables?.restaurantId === row.id &&
                              pendingVariables?.field === "delivery"
                            }
                            onToggleBeneficiary={(next) => toggleBeneficiary(row, "delivery", next)}
                          />
                        </td>
                        <td className="py-4 px-5">
                          <FeeCell
                            enabled={row.convenienceFeeEnabled}
                            mode={row.convenienceFeeMode}
                            amount={row.convenienceFeeAmount}
                            beneficiary={row.convenienceFeeBeneficiary}
                            layoutId={`beneficiary-pill-${row.id}-convenience`}
                            pending={
                              pendingVariables?.restaurantId === row.id &&
                              pendingVariables?.field === "convenience"
                            }
                            onToggleBeneficiary={(next) => toggleBeneficiary(row, "convenience", next)}
                          />
                        </td>
                      </motion.tr>
                    ))}
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
