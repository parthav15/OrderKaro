"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Loader2, Phone, Plus, TicketCheck, Trash2 } from "lucide-react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import api from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe"
import { deliveryExemptionSchema, type DeliveryExemptionInput } from "@orderkaro/shared"

interface DeliveryExemption {
  id: string
  phone: string
  label: string | null
  createdAt: string
}

interface DeliveryExemptionsCardProps {
  restaurantId: string
}

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.length !== 10) return phone
  return `${digits.slice(0, 5)} ${digits.slice(5)}`
}

interface HoldToRemoveProps {
  onConfirm: () => void
  pending: boolean
  ariaLabel: string
}

function HoldToRemove({ onConfirm, pending, ariaLabel }: HoldToRemoveProps) {
  const reduceMotion = useReducedMotionSafe()
  const [holding, setHolding] = useState(false)
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef(0)
  const firedRef = useRef(false)
  const size = 36
  const radius = size / 2 - 2
  const circumference = 2 * Math.PI * radius

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    startRef.current = 0
    setHolding(false)
    setProgress(0)
  }

  const tick = (timestamp: number) => {
    if (!startRef.current) startRef.current = timestamp
    const elapsed = timestamp - startRef.current
    const next = Math.min(1, elapsed / 800)
    setProgress(next)
    if (next >= 1) {
      if (!firedRef.current) {
        firedRef.current = true
        onConfirm()
      }
      stop()
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const begin = () => {
    if (pending) return
    firedRef.current = false
    setHolding(true)
    rafRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => () => stop(), [])

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onPointerDown={(e) => {
        e.preventDefault()
        begin()
      }}
      onPointerUp={stop}
      onPointerLeave={() => holding && stop()}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      disabled={pending}
      aria-label={ariaLabel}
      title="Hold to remove"
      style={{ width: size, height: size }}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full border transition-colors disabled:opacity-50 select-none shrink-0",
        holding ? "border-danger/50 text-danger" : "border-line text-muted hover:border-danger/40 hover:text-danger"
      )}
    >
      {pending ? (
        <Loader2 className="w-4 h-4 animate-spin relative z-10" />
      ) : (
        <Trash2 className="w-4 h-4 relative z-10" />
      )}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90 pointer-events-none"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--danger))"
          strokeOpacity={holding ? 0.9 : 0}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          style={{ transition: reduceMotion ? "none" : "stroke-opacity 120ms ease-out" }}
        />
      </svg>
    </motion.button>
  )
}

export function DeliveryExemptionsCard({ restaurantId }: DeliveryExemptionsCardProps) {
  const reduceMotion = useReducedMotionSafe()
  const queryClient = useQueryClient()
  const [phoneInput, setPhoneInput] = useState("")
  const [labelInput, setLabelInput] = useState("")
  const [phoneError, setPhoneError] = useState<string | null>(null)

  const queryKey = ["delivery-exemptions", restaurantId]

  const exemptionsQuery = useQuery<DeliveryExemption[]>({
    queryKey,
    queryFn: () =>
      api.get(`/api/v1/restaurants/${restaurantId}/delivery-exemptions`).then((r) => r.data.data),
    enabled: !!restaurantId,
  })

  const addMutation = useMutation({
    mutationFn: (payload: DeliveryExemptionInput) =>
      api
        .post(`/api/v1/restaurants/${restaurantId}/delivery-exemptions`, payload)
        .then((r) => r.data.data as DeliveryExemption),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success("Exemption added")
      setPhoneInput("")
      setLabelInput("")
      setPhoneError(null)
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to add exemption"),
  })

  const removeMutation = useMutation({
    mutationFn: (exemptionId: string) =>
      api.delete(`/api/v1/restaurants/${restaurantId}/delivery-exemptions/${exemptionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success("Exemption removed")
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to remove exemption"),
  })

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const parsed = deliveryExemptionSchema.safeParse({
      phone: phoneInput.trim(),
      label: labelInput.trim() || undefined,
    })
    if (!parsed.success) {
      setPhoneError("Enter a valid phone number (10 digits)")
      return
    }
    setPhoneError(null)
    addMutation.mutate(parsed.data)
  }

  const exemptions = exemptionsQuery.data ?? []

  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0.01 : 0.45,
        delay: reduceMotion ? 0 : 0.16,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="mt-5"
    >
      <Card className="overflow-hidden">
        <CardHeader className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <TicketCheck className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-ink truncate">Delivery fee exemptions</h2>
              <p className="text-xs text-muted">
                Diners who order delivery with an exempt phone pay ₹0 delivery &amp; handling.
              </p>
            </div>
          </div>
          {exemptions.length > 0 && (
            <span className="shrink-0 text-xs font-bold text-muted bg-surface-elevated rounded-full px-2.5 py-1 tabular-nums">
              {exemptions.length}
            </span>
          )}
        </CardHeader>

        <CardContent className="space-y-5">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone number"
                type="tel"
                inputMode="tel"
                placeholder="98765 43210"
                value={phoneInput}
                onChange={(e) => {
                  setPhoneInput(e.target.value)
                  if (phoneError) setPhoneError(null)
                }}
                maxLength={20}
                required
                error={phoneError ?? undefined}
              />
              <Input
                label="Label"
                type="text"
                placeholder="Optional — e.g. Teacher"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                maxLength={80}
              />
            </div>
            <Button type="submit" loading={addMutation.isPending} disabled={!phoneInput.trim()}>
              <Plus className="w-4 h-4" /> Add exemption
            </Button>
          </form>

          {exemptionsQuery.isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-surface-elevated animate-pulse" />
              ))}
            </div>
          )}

          {exemptionsQuery.isError && (
            <div className="flex flex-col items-center text-center py-10">
              <AlertTriangle className="w-8 h-8 text-danger/40 mb-3" />
              <p className="text-sm font-semibold text-ink">Couldn&apos;t load exemptions</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => exemptionsQuery.refetch()}
              >
                Try again
              </Button>
            </div>
          )}

          {!exemptionsQuery.isLoading && !exemptionsQuery.isError && exemptions.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-dashed border-line py-10 text-center"
            >
              <TicketCheck className="w-8 h-8 text-muted/30 mx-auto mb-2" />
              <p className="text-sm font-medium text-muted">No exemptions yet</p>
              <p className="text-xs text-muted/70 mt-0.5">
                Add a phone number to waive delivery &amp; handling for them
              </p>
            </motion.div>
          )}

          {!exemptionsQuery.isLoading && !exemptionsQuery.isError && exemptions.length > 0 && (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {exemptions.map((exemption) => (
                  <motion.div
                    key={exemption.id}
                    layout
                    initial={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, x: 24, height: 0, marginBottom: 0 }
                    }
                    transition={{ duration: reduceMotion ? 0.01 : 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 overflow-hidden"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-surface-elevated flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 text-muted" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-ink tabular-nums truncate">
                          {formatPhoneDisplay(exemption.phone)}
                        </p>
                        {exemption.label && (
                          <p className="text-xs text-muted truncate">{exemption.label}</p>
                        )}
                      </div>
                    </div>
                    <HoldToRemove
                      onConfirm={() => removeMutation.mutate(exemption.id)}
                      pending={removeMutation.isPending && removeMutation.variables === exemption.id}
                      ariaLabel={`Hold to remove ${exemption.phone}`}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
