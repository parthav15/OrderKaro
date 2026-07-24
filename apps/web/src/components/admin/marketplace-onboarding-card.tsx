"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Landmark, Check, Pencil, AlertTriangle } from "lucide-react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/stores/auth"
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe"
import { cn } from "@/lib/utils"
import api from "@/lib/api"
import { toast } from "sonner"

type VendorKycStatus = "PENDING" | "VERIFIED" | "REJECTED"
type PayoutMethod = "BANK" | "UPI"

interface MarketplaceOnboardingData {
  collectionMode: "BYO" | "MARKETPLACE"
  vendorKycStatus: VendorKycStatus
  onboarded: boolean
  payoutName: string | null
  payoutEmail: string | null
  payoutPhone: string | null
  payoutUpi: string | null
  payoutIfsc: string | null
  hasBankAccount: boolean
}

interface OnboardingFormState {
  name: string
  email: string
  phone: string
  pan: string
  payoutMethod: PayoutMethod
  bankAccount: string
  ifsc: string
  upi: string
}

const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/
const UPI_PATTERN = /^[\w.-]{2,}@[a-zA-Z]{2,}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function emptyForm(): OnboardingFormState {
  return {
    name: "",
    email: "",
    phone: "",
    pan: "",
    payoutMethod: "BANK",
    bankAccount: "",
    ifsc: "",
    upi: "",
  }
}

function deriveForm(
  data: MarketplaceOnboardingData,
  fallback: { name?: string; email?: string; phone?: string }
): OnboardingFormState {
  return {
    name: data.payoutName || fallback.name || "",
    email: data.payoutEmail || fallback.email || "",
    phone: data.payoutPhone || fallback.phone || "",
    pan: "",
    payoutMethod: data.hasBankAccount ? "BANK" : data.payoutUpi ? "UPI" : "BANK",
    bankAccount: "",
    ifsc: data.payoutIfsc || "",
    upi: data.payoutUpi || "",
  }
}

function extractErrorMessage(err: unknown, fallback: string) {
  const response = (err as { response?: { data?: { error?: string } } })?.response
  return response?.data?.error || fallback
}

function kycBadgeVariant(status: VendorKycStatus): "success" | "warning" | "danger" {
  if (status === "VERIFIED") return "success"
  if (status === "REJECTED") return "danger"
  return "warning"
}

function kycBadgeLabel(status: VendorKycStatus) {
  if (status === "VERIFIED") return "Bank verified"
  if (status === "REJECTED") return "Bank verification failed"
  return "Bank verification in progress"
}

function fieldError(value: string, valid: boolean, message: string) {
  if (valid || value.length === 0) return undefined
  return message
}

function FieldStagger({ index, children }: { index: number; children: React.ReactNode }) {
  const reduceMotion = useReducedMotionSafe()
  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0.01 : 0.4,
        delay: reduceMotion ? 0 : 0.06 * index,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  )
}

function PayoutMethodSwitch({
  value,
  onChange,
}: {
  value: PayoutMethod
  onChange: (value: PayoutMethod) => void
}) {
  const reduceMotion = useReducedMotionSafe()
  const options: { value: PayoutMethod; label: string }[] = [
    { value: "BANK", label: "Bank account" },
    { value: "UPI", label: "UPI" },
  ]

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-line bg-surface p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn(
            "relative rounded-lg px-4 py-2 text-sm font-bold transition-colors duration-200",
            value === option.value ? "text-white" : "text-muted hover:text-ink"
          )}
        >
          {value === option.value && (
            <motion.span
              layoutId="payout-method-pill"
              className="absolute inset-0 rounded-lg bg-primary"
              transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
            />
          )}
          <span className="relative z-10">{option.label}</span>
        </button>
      ))}
    </div>
  )
}

interface OnboardingFormProps {
  data: MarketplaceOnboardingData
  form: OnboardingFormState
  onFieldChange: <K extends keyof OnboardingFormState>(key: K, value: OnboardingFormState[K]) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  saving: boolean
  justSaved: boolean
}

function OnboardingForm({ data, form, onFieldChange, onSubmit, onCancel, saving, justSaved }: OnboardingFormProps) {
  const reduceMotion = useReducedMotionSafe()

  const nameValid = form.name.trim().length >= 2
  const emailValid = EMAIL_PATTERN.test(form.email.trim())
  const phoneValid = form.phone.trim().length >= 8
  const panValid = PAN_PATTERN.test(form.pan)
  const bankAccountValid = form.bankAccount.trim().length >= 6
  const ifscValid = IFSC_PATTERN.test(form.ifsc)
  const upiValid = UPI_PATTERN.test(form.upi.trim())
  const methodValid = form.payoutMethod === "UPI" ? upiValid : bankAccountValid && ifscValid
  const isFormValid = nameValid && emailValid && phoneValid && panValid && methodValid

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="overflow-hidden space-y-6"
      onSubmit={onSubmit}
    >
      <FieldStagger index={0}>
        <p className="text-sm text-muted leading-relaxed">
          You keep <span className="font-bold text-accent">100%</span> of your menu price. Vision Menu collects
          each payment and settles your earnings straight to this account.
        </p>
      </FieldStagger>

      <FieldStagger index={1}>
        <Input
          label="Name"
          value={form.name}
          onChange={(e) => onFieldChange("name", e.target.value)}
          placeholder="Full name"
          maxLength={120}
        />
      </FieldStagger>

      <FieldStagger index={2}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => onFieldChange("email", e.target.value)}
            placeholder="you@example.com"
            error={fieldError(form.email, emailValid, "Enter a valid email")}
          />
          <Input
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => onFieldChange("phone", e.target.value)}
            placeholder="9876543210"
            maxLength={20}
          />
        </div>
      </FieldStagger>

      <FieldStagger index={3}>
        <div>
          <Input
            label="PAN"
            value={form.pan}
            onChange={(e) => onFieldChange("pan", e.target.value.toUpperCase())}
            placeholder="ABCDE1234F"
            maxLength={10}
            error={fieldError(form.pan, panValid, "Enter a valid PAN, e.g. ABCDE1234F")}
          />
          <p className="text-xs text-muted mt-1.5">
            Required every update for bank verification — never stored in plain text
          </p>
        </div>
      </FieldStagger>

      <FieldStagger index={4}>
        <div className="space-y-3">
          <span className="block text-sm font-medium text-ink">Payout method</span>
          <PayoutMethodSwitch value={form.payoutMethod} onChange={(value) => onFieldChange("payoutMethod", value)} />
        </div>
      </FieldStagger>

      <AnimatePresence mode="wait" initial={false}>
        {form.payoutMethod === "BANK" ? (
          <motion.div
            key="bank"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <Input
              label="Account number"
              value={form.bankAccount}
              onChange={(e) => onFieldChange("bankAccount", e.target.value)}
              placeholder={data.hasBankAccount ? "Re-enter to update" : "Account number"}
              maxLength={30}
            />
            <Input
              label="IFSC code"
              value={form.ifsc}
              onChange={(e) => onFieldChange("ifsc", e.target.value.toUpperCase())}
              placeholder="HDFC0001234"
              maxLength={11}
              error={fieldError(form.ifsc, ifscValid, "Enter a valid IFSC code")}
            />
          </motion.div>
        ) : (
          <motion.div
            key="upi"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <Input
              label="UPI ID"
              value={form.upi}
              onChange={(e) => onFieldChange("upi", e.target.value)}
              placeholder="yourname@bank"
              error={fieldError(form.upi, upiValid, "Enter a valid UPI ID")}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <FieldStagger index={5}>
        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" loading={saving} disabled={saving || !isFormValid}>
            <AnimatePresence mode="wait" initial={false}>
              {justSaved ? (
                <motion.span
                  key="done"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
                  transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
                  className="inline-flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Payouts active
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
                  {data.onboarded ? "Save payout details" : "Activate payouts"}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
          {data.onboarded && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
          )}
        </div>
      </FieldStagger>
    </motion.form>
  )
}

function OnboardingSummary({ data, onEdit }: { data: MarketplaceOnboardingData; onEdit: () => void }) {
  const reduceMotion = useReducedMotionSafe()

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="overflow-hidden space-y-5"
    >
      <p className="text-sm text-muted leading-relaxed">
        You keep <span className="font-bold text-accent">100%</span> of your menu price — Vision Menu settles
        your earnings straight to this account.
      </p>

      <div className="p-4 rounded-xl bg-surface-elevated border border-line space-y-3">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-bold text-muted uppercase tracking-wider">Payout destination</span>
          <span className="text-sm font-semibold text-ink font-mono">
            {data.hasBankAccount ? "Bank ••••" : data.payoutUpi}
          </span>
        </div>
        {data.hasBankAccount && data.payoutIfsc && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">IFSC</span>
            <span className="text-sm font-semibold text-ink font-mono">{data.payoutIfsc}</span>
          </div>
        )}
        {data.payoutName && (
          <div className="flex items-center justify-between gap-4 pt-3 border-t border-line">
            <span className="text-xs text-muted">Registered to</span>
            <span className="text-sm font-medium text-ink">{data.payoutName}</span>
          </div>
        )}
      </div>

      {data.vendorKycStatus === "REJECTED" && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-danger/5 border border-danger/20">
          <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
          <p className="text-sm text-danger leading-relaxed">
            Vision Menu couldn&apos;t verify these payout details. Update them to try again.
          </p>
        </div>
      )}

      <Button type="button" variant="outline" onClick={onEdit}>
        <Pencil className="w-4 h-4" /> Update payout details
      </Button>
    </motion.div>
  )
}

interface MarketplaceOnboardingCardProps {
  restaurantId: string
}

export function MarketplaceOnboardingCard({ restaurantId }: MarketplaceOnboardingCardProps) {
  const queryClient = useQueryClient()
  const reduceMotion = useReducedMotionSafe()
  const authUser = useAuthStore((s) => s.user)

  const [form, setForm] = useState<OnboardingFormState>(emptyForm())
  const [isEditing, setIsEditing] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const initializedRef = useRef(false)
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const query = useQuery<MarketplaceOnboardingData>({
    queryKey: ["marketplace-onboarding", restaurantId],
    queryFn: () =>
      api.get(`/api/v1/restaurants/${restaurantId}/marketplace-onboarding`).then((r) => r.data.data),
    enabled: !!restaurantId,
  })

  const data = query.data

  useEffect(() => {
    if (!data || initializedRef.current) return
    initializedRef.current = true
    setForm(deriveForm(data, authUser ?? {}))
  }, [data, authUser])

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
    }
  }, [])

  function updateField<K extends keyof OnboardingFormState>(key: K, value: OnboardingFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      api.post(`/api/v1/restaurants/${restaurantId}/marketplace-onboarding`, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        pan: form.pan,
        payoutMethod: form.payoutMethod,
        ...(form.payoutMethod === "UPI"
          ? { upi: form.upi.trim() }
          : { bankAccount: form.bankAccount.trim(), ifsc: form.ifsc }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace-onboarding", restaurantId] })
      toast.success("Payout details saved")
      setForm((prev) => ({ ...prev, pan: "", bankAccount: "" }))
      setJustSaved(true)
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
      savedTimeoutRef.current = setTimeout(() => {
        setJustSaved(false)
        setIsEditing(false)
      }, 1500)
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Could not save payout details")),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    saveMutation.mutate()
  }

  function handleStartEditing() {
    if (data) setForm(deriveForm(data, authUser ?? {}))
    setIsEditing(true)
  }

  function handleCancelEditing() {
    if (data) setForm(deriveForm(data, authUser ?? {}))
    setIsEditing(false)
  }

  if (query.isLoading) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="h-7 w-64 rounded-lg bg-surface-elevated animate-pulse mb-3" />
          <div className="h-4 w-full max-w-sm rounded-lg bg-surface-elevated animate-pulse mb-8" />
          <div className="h-44 rounded-xl bg-surface-elevated animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  if (query.isError || !data) {
    return (
      <Card>
        <CardContent className="py-10 flex flex-col items-center text-center gap-3">
          <AlertTriangle className="w-8 h-8 text-danger/50" />
          <p className="text-sm font-semibold text-ink">Couldn&apos;t load payout details</p>
          <Button variant="outline" size="sm" onClick={() => query.refetch()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    )
  }

  const showForm = !data.onboarded || isEditing

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
                <Landmark className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-ink">Get paid by Vision Menu</h2>
                <p className="text-sm text-muted">
                  {data.onboarded
                    ? "Payouts active — settling to your account"
                    : "Payouts settle straight to your bank or UPI"}
                </p>
              </div>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              {data.onboarded && (
                <motion.div
                  key={data.vendorKycStatus}
                  initial={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                  transition={{ duration: reduceMotion ? 0.01 : 0.25 }}
                >
                  <Badge variant={kycBadgeVariant(data.vendorKycStatus)}>{kycBadgeLabel(data.vendorKycStatus)}</Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardHeader>

        <CardContent className="py-6">
          <AnimatePresence mode="wait" initial={false}>
            {showForm ? (
              <OnboardingForm
                key="form"
                data={data}
                form={form}
                onFieldChange={updateField}
                onSubmit={handleSubmit}
                onCancel={handleCancelEditing}
                saving={saveMutation.isPending}
                justSaved={justSaved}
              />
            ) : (
              <OnboardingSummary key="summary" data={data} onEdit={handleStartEditing} />
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}
