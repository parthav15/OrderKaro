"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X, ExternalLink } from "lucide-react"
import type { ModelRequestUpdateInput } from "@orderkaro/shared"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PLANS, type PlanName } from "@/lib/plans"
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe"

export type ModelRequestStatus = ModelRequestUpdateInput["status"]
export type ModelRequestAction = "complete" | "reject"

export interface ModelRequestRow {
  id: string
  status: ModelRequestStatus
  resultUrl: string | null
  createdAt: string
  menuItem: {
    id: string
    name: string
    imageUrl: string | null
  }
  restaurant: {
    id: string
    name: string
    slug: string
    plan: PlanName
  }
}

function isValidModelUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return false
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

function statusBadgeVariant(status: ModelRequestStatus): "default" | "success" | "warning" | "danger" {
  if (status === "COMPLETED") return "success"
  if (status === "REJECTED") return "danger"
  if (status === "PENDING") return "warning"
  return "default"
}

function statusLabel(status: ModelRequestStatus) {
  if (status === "IN_PROGRESS") return "In Progress"
  if (status === "COMPLETED") return "Completed"
  if (status === "REJECTED") return "Rejected"
  return "Pending"
}

function formatRequestedAt(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function StatusBadge({ status }: { status: ModelRequestStatus }) {
  const reduceMotion = useReducedMotionSafe()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={status}
        initial={{ opacity: 0, y: reduceMotion ? 0 : -6, scale: reduceMotion ? 1 : 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: reduceMotion ? 0 : 6, scale: reduceMotion ? 1 : 0.92 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <Badge variant={statusBadgeVariant(status)}>{statusLabel(status)}</Badge>
      </motion.div>
    </AnimatePresence>
  )
}

interface ActionButtonProps {
  onClick: () => void
  pending: boolean
  done: boolean
  disabled?: boolean
  variant: "primary" | "outline"
  idleLabel: React.ReactNode
  pendingLabel: React.ReactNode
  doneLabel: React.ReactNode
}

function ActionButton({
  onClick,
  pending,
  done,
  disabled,
  variant,
  idleLabel,
  pendingLabel,
  doneLabel,
}: ActionButtonProps) {
  const reduceMotion = useReducedMotionSafe()
  const phase = pending ? "pending" : done ? "done" : "idle"
  const label = phase === "pending" ? pendingLabel : phase === "done" ? doneLabel : idleLabel

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      loading={pending}
      disabled={disabled || pending}
      onClick={onClick}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={phase}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.18 }}
          className="inline-flex items-center gap-1.5"
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </Button>
  )
}

interface ModelRequestCardProps {
  request: ModelRequestRow
  index: number
  pendingAction?: ModelRequestAction
  justDoneAction?: ModelRequestAction
  onComplete: (resultUrl: string) => void
  onReject: () => void
}

export function ModelRequestCard({
  request,
  index,
  pendingAction,
  justDoneAction,
  onComplete,
  onReject,
}: ModelRequestCardProps) {
  const reduceMotion = useReducedMotionSafe()
  const [resultUrlDraft, setResultUrlDraft] = useState("")

  const isTerminal = request.status === "COMPLETED" || request.status === "REJECTED"
  const showActionPanel = !isTerminal || Boolean(justDoneAction)
  const anyPending = Boolean(pendingAction)
  const planLabel = PLANS[request.restaurant.plan]?.label ?? request.restaurant.plan
  const urlError = resultUrlDraft.length > 0 && !isValidModelUrl(resultUrlDraft) ? "Enter a valid URL" : undefined

  function handleComplete() {
    if (!isValidModelUrl(resultUrlDraft)) return
    onComplete(resultUrlDraft.trim())
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.98 }}
      transition={{
        duration: reduceMotion ? 0.01 : 0.4,
        delay: reduceMotion ? 0 : index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <Card>
        <CardContent className="py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-line bg-surface-elevated">
                {request.menuItem.imageUrl ? (
                  <img
                    src={request.menuItem.imageUrl}
                    alt={request.menuItem.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="font-serif text-xl italic text-ink/25">
                      {request.menuItem.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">{request.menuItem.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="truncate text-xs text-muted">{request.restaurant.name}</span>
                  <Badge variant="editorial">{planLabel}</Badge>
                </div>
                <p className="mt-1.5 text-xs text-muted">Requested {formatRequestedAt(request.createdAt)}</p>
              </div>
            </div>
            <StatusBadge status={request.status} />
          </div>

          <AnimatePresence initial={false}>
            {showActionPanel ? (
              <motion.div
                key="actions"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: reduceMotion ? 0.01 : 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="overflow-hidden"
              >
                <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-start">
                  <div className="flex-1">
                    <Input
                      type="url"
                      value={resultUrlDraft}
                      onChange={(e) => setResultUrlDraft(e.target.value)}
                      placeholder="https://cdn.example.com/dish.glb"
                      aria-label="Hosted .glb model URL"
                      disabled={anyPending || Boolean(justDoneAction)}
                      error={urlError}
                    />
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <ActionButton
                      variant="primary"
                      onClick={handleComplete}
                      pending={pendingAction === "complete"}
                      done={justDoneAction === "complete"}
                      disabled={
                        (anyPending && pendingAction !== "complete") ||
                        Boolean(justDoneAction) ||
                        !isValidModelUrl(resultUrlDraft)
                      }
                      idleLabel={
                        <>
                          <Check className="h-3.5 w-3.5" /> Mark Complete
                        </>
                      }
                      pendingLabel="Publishing…"
                      doneLabel={
                        <>
                          <Check className="h-3.5 w-3.5" /> Published
                        </>
                      }
                    />
                    <ActionButton
                      variant="outline"
                      onClick={onReject}
                      pending={pendingAction === "reject"}
                      done={justDoneAction === "reject"}
                      disabled={(anyPending && pendingAction !== "reject") || Boolean(justDoneAction)}
                      idleLabel={
                        <>
                          <X className="h-3.5 w-3.5" /> Reject
                        </>
                      }
                      pendingLabel="Rejecting…"
                      doneLabel="Rejected"
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: reduceMotion ? 0.01 : 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="overflow-hidden"
              >
                <div className="mt-4 border-t border-line pt-4">
                  {request.status === "COMPLETED" && request.resultUrl ? (
                    <a
                      href={request.resultUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View published model
                    </a>
                  ) : (
                    <p className="text-sm italic text-muted">This request was rejected.</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}
