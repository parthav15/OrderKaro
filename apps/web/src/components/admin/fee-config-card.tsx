"use client"

import { useId } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Landmark } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe"
import { Card, CardHeader, CardContent } from "@/components/ui/card"

export type FeeMode = "FLAT" | "PERCENT"
export type FeeBeneficiary = "RESTAURANT" | "PLATFORM"

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  ariaLabel: string
  disabled?: boolean
}

export function ToggleSwitch({ checked, onChange, ariaLabel, disabled }: ToggleSwitchProps) {
  const reduceMotion = useReducedMotionSafe()

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full p-0.5 transition-colors duration-200 disabled:opacity-40 disabled:pointer-events-none",
        checked ? "bg-primary" : "bg-line"
      )}
    >
      <motion.span
        layout
        transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 32 }}
        className={cn("block h-6 w-6 rounded-full bg-white shadow-sm", checked ? "ml-5" : "ml-0")}
      />
    </button>
  )
}

interface ModeSwitchProps {
  id: string
  mode: FeeMode
  onChange: (mode: FeeMode) => void
}

function ModeSwitch({ id, mode, onChange }: ModeSwitchProps) {
  const reduceMotion = useReducedMotionSafe()
  const options: { value: FeeMode; label: string }[] = [
    { value: "FLAT", label: "Flat ₹" },
    { value: "PERCENT", label: "Percent %" },
  ]

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-line bg-surface p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={mode === option.value}
          className={cn(
            "relative rounded-lg px-4 py-1.5 text-xs font-bold transition-colors duration-200",
            mode === option.value ? "text-white" : "text-muted hover:text-ink"
          )}
        >
          {mode === option.value && (
            <motion.span
              layoutId={`fee-mode-pill-${id}`}
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

interface AmountFieldProps {
  fieldId: string
  mode: FeeMode
  value: string
  onChange: (value: string) => void
  label: string
}

function AmountField({ fieldId, mode, value, onChange, label }: AmountFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        {mode === "FLAT" && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">
            ₹
          </span>
        )}
        <input
          id={fieldId}
          type="number"
          inputMode="decimal"
          min={0}
          max={100000}
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full rounded-xl border border-line bg-surface py-3 text-base text-ink placeholder:text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
            mode === "FLAT" ? "pl-8 pr-4" : "pl-4 pr-9"
          )}
        />
        {mode === "PERCENT" && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">
            %
          </span>
        )}
      </div>
    </div>
  )
}

function FeeBeneficiaryNote({ beneficiary }: { beneficiary: FeeBeneficiary }) {
  return (
    <div className="flex items-center gap-2 border-t border-line/70 pt-4 text-xs text-muted">
      <Landmark className="w-3.5 h-3.5 shrink-0 text-muted/70" />
      <span>
        Collected by:{" "}
        <span className="font-semibold text-ink">
          {beneficiary === "PLATFORM" ? "Vision Menu" : "Your account"}
        </span>
      </span>
    </div>
  )
}

interface FeeConfigCardProps {
  id: string
  icon: LucideIcon
  title: string
  description: string
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  mode: FeeMode
  onModeChange: (mode: FeeMode) => void
  amount: string
  onAmountChange: (value: string) => void
  beneficiary?: FeeBeneficiary
  index?: number
}

export function FeeConfigCard({
  id,
  icon: Icon,
  title,
  description,
  enabled,
  onEnabledChange,
  mode,
  onModeChange,
  amount,
  onAmountChange,
  beneficiary,
  index = 0,
}: FeeConfigCardProps) {
  const reduceMotion = useReducedMotionSafe()
  const fieldId = useId()

  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0.01 : 0.45,
        delay: reduceMotion ? 0 : 0.08 * index,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-ink truncate">{title}</h2>
              <p className="text-xs text-muted">{description}</p>
            </div>
          </div>
          <ToggleSwitch checked={enabled} onChange={onEnabledChange} ariaLabel={`Toggle ${title}`} />
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait" initial={false}>
            {enabled ? (
              <motion.div
                key="enabled"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: reduceMotion ? 0.01 : 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="space-y-4 overflow-hidden"
              >
                <div className="space-y-2">
                  <span className="block text-sm font-medium text-ink">Charge type</span>
                  <ModeSwitch id={id} mode={mode} onChange={onModeChange} />
                </div>
                <AmountField
                  fieldId={fieldId}
                  mode={mode}
                  value={amount}
                  onChange={onAmountChange}
                  label={mode === "FLAT" ? "Amount per order" : "Percent of subtotal"}
                />
              </motion.div>
            ) : (
              <motion.p
                key="disabled"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: reduceMotion ? 0.01 : 0.3 }}
                className="overflow-hidden text-sm text-muted italic"
              >
                This fee is switched off and won&apos;t be added to delivery orders.
              </motion.p>
            )}
          </AnimatePresence>
          {beneficiary && (
            <div className="mt-4">
              <FeeBeneficiaryNote beneficiary={beneficiary} />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface AnimatedAmountProps {
  value: number
  className?: string
  prefix?: string
}

export function AnimatedAmount({ value, className, prefix = "₹" }: AnimatedAmountProps) {
  const reduceMotion = useReducedMotionSafe()
  const display = `${prefix}${value.toFixed(2)}`

  return (
    <span className={cn("relative inline-flex overflow-hidden", className)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={display}
          initial={{ y: reduceMotion ? 0 : 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: reduceMotion ? 0 : -10, opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {display}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
