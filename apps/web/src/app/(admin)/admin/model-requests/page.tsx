"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query"
import { Shield, Boxes, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/auth"
import api from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe"
import {
  ModelRequestCard,
  type ModelRequestRow,
  type ModelRequestStatus,
  type ModelRequestAction,
} from "@/components/admin/model-request-card"

type StatusFilterValue = ModelRequestStatus | "ALL"

const STATUS_FILTERS: { value: StatusFilterValue; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REJECTED", label: "Rejected" },
]

const MODEL_REQUESTS_QUERY_KEY = "admin-model-requests"

interface UpdateVariables {
  id: string
  action: ModelRequestAction
  status: ModelRequestStatus
  resultUrl?: string
}

interface JustResolved {
  id: string
  action: ModelRequestAction
}

function StatusFilterTabs({
  value,
  onChange,
}: {
  value: StatusFilterValue
  onChange: (value: StatusFilterValue) => void
}) {
  const reduceMotion = useReducedMotionSafe()
  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-2xl border border-line bg-canvas/60 p-1.5">
      {STATUS_FILTERS.map((filter) => (
        <button
          key={filter.value}
          type="button"
          onClick={() => onChange(filter.value)}
          aria-pressed={value === filter.value}
          className={cn(
            "relative rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors duration-200",
            value === filter.value ? "text-white" : "text-muted hover:text-ink"
          )}
        >
          {value === filter.value && (
            <motion.span
              layoutId="model-request-status-pill"
              className="absolute inset-0 rounded-xl bg-primary"
              transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
            />
          )}
          <span className="relative z-10">{filter.label}</span>
        </button>
      ))}
    </div>
  )
}

export default function ModelRequestsPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const reduceMotion = useReducedMotionSafe()
  const isSuperAdmin = Boolean(user?.isSuperAdmin)

  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("ALL")
  const [justResolved, setJustResolved] = useState<JustResolved | null>(null)
  const resolveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (resolveTimeoutRef.current) clearTimeout(resolveTimeoutRef.current)
    }
  }, [])

  const requestsQuery = useQuery<ModelRequestRow[]>({
    queryKey: [MODEL_REQUESTS_QUERY_KEY, statusFilter],
    queryFn: () =>
      api
        .get(
          `/api/v1/admin/model-requests${statusFilter === "ALL" ? "" : `?status=${statusFilter}`}`
        )
        .then((r) => r.data.data),
    enabled: isSuperAdmin,
  })

  const updateMutation = useMutation<
    ModelRequestRow,
    unknown,
    UpdateVariables,
    { previous: [QueryKey, ModelRequestRow[] | undefined][] }
  >({
    mutationFn: ({ id, status, resultUrl }) =>
      api.patch(`/api/v1/admin/model-requests/${id}`, { status, resultUrl }).then((r) => r.data.data),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: [MODEL_REQUESTS_QUERY_KEY] })
      const previous = queryClient.getQueriesData<ModelRequestRow[]>({ queryKey: [MODEL_REQUESTS_QUERY_KEY] })
      queryClient.setQueriesData<ModelRequestRow[]>({ queryKey: [MODEL_REQUESTS_QUERY_KEY] }, (old) =>
        old?.map((row) =>
          row.id === variables.id
            ? { ...row, status: variables.status, resultUrl: variables.resultUrl ?? row.resultUrl }
            : row
        )
      )
      return { previous }
    },
    onError: (err: any, _variables, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data))
      toast.error(err.response?.data?.error || "Failed to update this request")
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.action === "complete" ? "Model published to the dish" : "Request rejected")
      setJustResolved({ id: variables.id, action: variables.action })
      if (resolveTimeoutRef.current) clearTimeout(resolveTimeoutRef.current)
      resolveTimeoutRef.current = setTimeout(() => setJustResolved(null), 1400)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [MODEL_REQUESTS_QUERY_KEY] })
    },
  })

  const pendingVariables = updateMutation.isPending ? updateMutation.variables : undefined
  const requests = requestsQuery.data ?? []

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

  if (requestsQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <AlertTriangle className="w-12 h-12 text-danger/40 mb-4" />
        <h2 className="text-lg font-bold text-ink">Couldn&apos;t load model requests</h2>
        <p className="text-muted text-sm mt-1 mb-5">
          Something went wrong while fetching AR model requests.
        </p>
        <Button variant="outline" onClick={() => requestsQuery.refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.4 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Boxes className="w-5 h-5 text-brand-red" />
          </div>
          <h1 className="text-2xl font-extrabold text-ink">AR Model Requests</h1>
        </div>
        <p className="text-muted text-sm max-w-2xl">
          Review dish photos submitted for 3D conversion and publish the finished .glb straight to the menu item.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.4, delay: reduceMotion ? 0 : 0.06 }}
        className="mb-6"
      >
        <StatusFilterTabs value={statusFilter} onChange={setStatusFilter} />
      </motion.div>

      {requestsQuery.isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-surface-elevated animate-pulse" />
          ))}
        </div>
      )}

      {!requestsQuery.isLoading && requests.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 border border-dashed border-line rounded-2xl"
        >
          <Boxes className="w-12 h-12 text-muted/30 mx-auto mb-3" />
          <p className="text-muted font-medium">
            {statusFilter === "ALL" ? "No AR model requests yet" : "No requests match this filter"}
          </p>
        </motion.div>
      )}

      {!requestsQuery.isLoading && requests.length > 0 && (
        <AnimatePresence initial={false}>
          <div className="space-y-3">
            {requests.map((request, idx) => (
              <ModelRequestCard
                key={request.id}
                request={request}
                index={idx}
                pendingAction={pendingVariables?.id === request.id ? pendingVariables.action : undefined}
                justDoneAction={justResolved?.id === request.id ? justResolved.action : undefined}
                onComplete={(resultUrl) =>
                  updateMutation.mutate({ id: request.id, action: "complete", status: "COMPLETED", resultUrl })
                }
                onReject={() => updateMutation.mutate({ id: request.id, action: "reject", status: "REJECTED" })}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
