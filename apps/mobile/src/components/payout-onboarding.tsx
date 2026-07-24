import { useEffect, useRef, useState } from "react"
import { View, TextInput, Pressable, ActivityIndicator } from "react-native"
import { MotiView, AnimatePresence } from "moti"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as Haptics from "expo-haptics"
import {
  Landmark,
  Smartphone,
  ShieldCheck,
  Check,
  Clock,
  AlertTriangle,
  Sparkles,
} from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { ownerApi } from "@/lib/owner-api"
import { getOwnerProfile } from "@/lib/owner-auth"
import { useTheme } from "@/theme/theme-provider"
import type { OwnerRestaurant } from "@/lib/types"

type PayoutMethod = "BANK" | "UPI"
type KycStatus = "PENDING" | "VERIFIED" | "REJECTED"
type SubmitPhase = "idle" | "loading" | "success"

interface MarketplaceOnboarding {
  collectionMode: "BYO" | "MARKETPLACE"
  vendorKycStatus: KycStatus
  onboarded: boolean
  payoutName?: string | null
  payoutEmail?: string | null
  payoutPhone?: string | null
  payoutUpi?: string | null
  payoutIfsc?: string | null
  hasBankAccount: boolean
}

interface OnboardResult {
  collectionMode: "BYO" | "MARKETPLACE"
  vendorKycStatus: KycStatus
  onboarded: boolean
  payoutName?: string | null
  payoutUpi?: string | null
  payoutIfsc?: string | null
}

const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/
const UPI_PATTERN = /^[\w.-]{2,}@[a-zA-Z]{2,}$/
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

const KYC_META: Record<
  KycStatus,
  { label: string; tone: "success" | "warning" | "danger"; pill: string }
> = {
  PENDING: { label: "Verification in progress", tone: "warning", pill: "bg-warning/15" },
  VERIFIED: { label: "Verified", tone: "success", pill: "bg-success/15" },
  REJECTED: { label: "Action needed", tone: "danger", pill: "bg-danger/15" },
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "sentences",
  maxLength,
  error,
  delay = 0,
}: {
  label: string
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  keyboardType?: "default" | "email-address" | "number-pad" | "phone-pad"
  autoCapitalize?: "none" | "sentences" | "words" | "characters"
  maxLength?: number
  error?: string
  delay?: number
}) {
  const { colors } = useTheme()
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 360, delay }}
      className="mb-3"
    >
      <Text variant="muted" className="text-xs uppercase tracking-widest mb-1.5">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        maxLength={maxLength}
        className={`h-14 rounded-2xl bg-canvas border px-5 text-ink font-sans-medium text-base ${
          error ? "border-danger" : "border-line"
        }`}
      />
      <AnimatePresence>
        {error ? (
          <MotiView
            from={{ opacity: 0, translateY: -4 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "timing", duration: 220 }}
          >
            <Text className="text-danger font-sans-medium text-xs mt-1.5">{error}</Text>
          </MotiView>
        ) : null}
      </AnimatePresence>
    </MotiView>
  )
}

function MethodToggle({
  method,
  onChange,
}: {
  method: PayoutMethod
  onChange: (next: PayoutMethod) => void
}) {
  const { colors } = useTheme()
  const [width, setWidth] = useState(0)
  const segment = (width - 8) / 2
  const options: { id: PayoutMethod; label: string; Icon: typeof Landmark }[] = [
    { id: "BANK", label: "Bank account", Icon: Landmark },
    { id: "UPI", label: "UPI", Icon: Smartphone },
  ]
  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      className="relative flex-row h-14 rounded-2xl bg-canvas border border-line p-1 mb-5"
    >
      {width > 0 ? (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1, translateX: method === "BANK" ? 0 : segment }}
          transition={{ type: "spring", damping: 20, stiffness: 220 }}
          style={{ width: segment }}
          className="absolute top-1 bottom-1 left-1 rounded-xl bg-primary"
        />
      ) : null}
      {options.map((option) => {
        const active = method === option.id
        return (
          <Pressable
            key={option.id}
            onPress={() => {
              if (!active) Haptics.selectionAsync()
              onChange(option.id)
            }}
            className="flex-1 flex-row items-center justify-center gap-2"
          >
            <option.Icon size={16} color={active ? colors.onPrimary : colors.muted} />
            <Text
              variant="label"
              className="text-sm"
              style={{ color: active ? colors.onPrimary : colors.ink }}
            >
              {option.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function KycBadge({ status }: { status: KycStatus }) {
  const { colors } = useTheme()
  const meta = KYC_META[status]
  const tint = colors[meta.tone]
  const Icon =
    status === "VERIFIED" ? ShieldCheck : status === "PENDING" ? Clock : AlertTriangle
  return (
    <AnimatePresence exitBeforeEnter>
      <MotiView
        key={status}
        from={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ type: "spring", damping: 18, stiffness: 240 }}
        className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${meta.pill}`}
      >
        <Icon size={13} color={tint} />
        <Text variant="label" className="text-xs" style={{ color: tint }}>
          {meta.label}
        </Text>
      </MotiView>
    </AnimatePresence>
  )
}

function SubmitButton({
  phase,
  disabled,
  label,
  onPress,
}: {
  phase: SubmitPhase
  disabled: boolean
  label: string
  onPress: () => void
}) {
  const { colors } = useTheme()
  const [pressed, setPressed] = useState(false)
  const busy = phase !== "idle"
  return (
    <Pressable
      disabled={disabled || busy}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
    >
      <MotiView
        animate={{
          scale: pressed ? 0.97 : 1,
          opacity: disabled && phase === "idle" ? 0.55 : 1,
          backgroundColor: phase === "success" ? colors.success : colors.primary,
        }}
        transition={{ type: "timing", duration: 200 }}
        className="h-14 rounded-2xl items-center justify-center px-6"
      >
        <AnimatePresence exitBeforeEnter>
          {phase === "loading" ? (
            <MotiView key="loading" from={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ActivityIndicator color={colors.onPrimary} />
            </MotiView>
          ) : phase === "success" ? (
            <MotiView
              key="success"
              from={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 200 }}
            >
              <Check size={24} color={colors.onPrimary} strokeWidth={3} />
            </MotiView>
          ) : (
            <MotiView key="idle" from={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Text variant="label" className="text-base" style={{ color: colors.onPrimary }}>
                {label}
              </Text>
            </MotiView>
          )}
        </AnimatePresence>
      </MotiView>
    </Pressable>
  )
}

function DestinationRow({
  Icon,
  label,
  value,
}: {
  Icon?: typeof Landmark
  label: string
  value: string
}) {
  const { colors } = useTheme()
  return (
    <View className="flex-row items-center gap-3">
      {Icon ? (
        <View className="w-9 h-9 rounded-xl bg-surface border border-line items-center justify-center">
          <Icon size={16} color={colors.accent} />
        </View>
      ) : (
        <View className="w-9" />
      )}
      <View className="flex-1">
        <Text variant="muted" className="text-[11px] uppercase tracking-widest mb-0.5">
          {label}
        </Text>
        <Text variant="title" className="text-base">
          {value}
        </Text>
      </View>
    </View>
  )
}

export function PayoutOnboarding({ restaurant }: { restaurant?: OwnerRestaurant }) {
  const { colors } = useTheme()
  const queryClient = useQueryClient()
  const rid = restaurant?.id
  const queryKey = ["owner-marketplace-onboarding", rid]

  const [editing, setEditing] = useState(false)
  const [method, setMethod] = useState<PayoutMethod>("BANK")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [pan, setPan] = useState("")
  const [bankAccount, setBankAccount] = useState("")
  const [ifsc, setIfsc] = useState("")
  const [upi, setUpi] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState("")
  const [phase, setPhase] = useState<SubmitPhase>("idle")
  const prefilled = useRef(false)

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      ownerApi.get<MarketplaceOnboarding>(`/api/v1/restaurants/${rid}/marketplace-onboarding`),
    enabled: !!rid,
  })

  useEffect(() => {
    getOwnerProfile().then((profile) => {
      if (!profile) return
      setName((current) => current || profile.name || "")
      setEmail((current) => current || profile.email || "")
    })
  }, [])

  useEffect(() => {
    if (!data || prefilled.current) return
    prefilled.current = true
    const fallbackName = restaurant?.name ?? ""
    if (data.payoutName) setName(data.payoutName)
    else if (fallbackName) setName((current) => current || fallbackName)
    if (data.payoutEmail) setEmail(data.payoutEmail)
    if (data.payoutPhone) setPhone(data.payoutPhone)
    if (data.payoutUpi) setUpi(data.payoutUpi)
    if (data.payoutIfsc) setIfsc(data.payoutIfsc)
    if (data.payoutUpi && !data.hasBankAccount) setMethod("UPI")
  }, [data, restaurant])

  const submit = useMutation({
    mutationFn: () => {
      const base = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        pan: pan.trim().toUpperCase(),
        payoutMethod: method,
      }
      const body =
        method === "BANK"
          ? { ...base, bankAccount: bankAccount.trim(), ifsc: ifsc.trim().toUpperCase() }
          : { ...base, upi: upi.trim() }
      return ownerApi.post<OnboardResult>(
        `/api/v1/restaurants/${rid}/marketplace-onboarding`,
        body
      )
    },
    onSuccess: (result) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setPhase("success")
      setTimeout(() => {
        queryClient.setQueryData<MarketplaceOnboarding>(queryKey, (previous) => ({
          collectionMode: result.collectionMode,
          vendorKycStatus: result.vendorKycStatus,
          onboarded: true,
          payoutName: result.payoutName ?? previous?.payoutName ?? name.trim(),
          payoutEmail: previous?.payoutEmail ?? email.trim(),
          payoutPhone: previous?.payoutPhone ?? phone.trim(),
          payoutUpi: result.payoutUpi ?? (method === "UPI" ? upi.trim() : null),
          payoutIfsc:
            result.payoutIfsc ??
            (method === "BANK" ? ifsc.trim().toUpperCase() : previous?.payoutIfsc ?? null),
          hasBankAccount: method === "BANK" ? true : previous?.hasBankAccount ?? false,
        }))
        setEditing(false)
        setPhase("idle")
        setBankAccount("")
        queryClient.invalidateQueries({ queryKey })
      }, 1200)
    },
    onError: (error) => {
      setPhase("idle")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      setServerError(error instanceof Error ? error.message : "Could not save payout details")
    },
  })

  function validate() {
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = "Enter the account holder's name"
    if (!EMAIL_PATTERN.test(email.trim())) next.email = "Enter a valid email address"
    if (!phone.trim()) next.phone = "Enter a contact number"
    if (!PAN_PATTERN.test(pan.trim().toUpperCase())) next.pan = "PAN should look like ABCDE1234F"
    if (method === "BANK") {
      if (!bankAccount.trim()) next.bankAccount = "Enter your account number"
      if (!IFSC_PATTERN.test(ifsc.trim().toUpperCase())) next.ifsc = "IFSC should look like HDFC0001234"
    } else {
      if (!UPI_PATTERN.test(upi.trim())) next.upi = "UPI ID should look like name@bank"
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function onSubmit() {
    setServerError("")
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
      return
    }
    setPhase("loading")
    submit.mutate()
  }

  const filled = Boolean(
    name.trim() &&
      email.trim() &&
      phone.trim() &&
      pan.trim() &&
      (method === "BANK" ? bankAccount.trim() && ifsc.trim() : upi.trim())
  )

  const showForm = editing || (data ? !data.onboarded : false)

  return (
    <AnimatePresence exitBeforeEnter>
      {!rid || isLoading || !data ? (
        <MotiView
          key="loading"
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bg-surface rounded-3xl border border-line p-5 h-44 items-center justify-center"
        >
          <ActivityIndicator color={colors.primary} />
        </MotiView>
      ) : showForm ? (
        <MotiView
          key="form"
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: -8 }}
          transition={{ type: "spring", damping: 22, stiffness: 190 }}
          className="bg-surface rounded-3xl border border-line p-5"
        >
          <View className="flex-row items-center gap-2 mb-2">
            <Sparkles size={14} color={colors.accent} />
            <Text className="text-accent tracking-[3px] text-[11px] font-sans-semibold">
              PAYOUTS
            </Text>
          </View>
          <Text variant="heading" className="text-2xl leading-tight mb-2">
            Get paid by Vision Menu
          </Text>
          <Text variant="muted" className="text-sm leading-relaxed mb-5">
            You keep 100% of your menu price. Vision Menu collects each payment and settles your
            earnings straight to this account.
          </Text>

          <MethodToggle method={method} onChange={setMethod} />

          <Field
            label="Account holder name"
            value={name}
            onChangeText={setName}
            placeholder="As per bank records"
            error={errors.name}
            delay={40}
          />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@restaurant.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            delay={80}
          />
          <Field
            label="Phone"
            value={phone}
            onChangeText={(text) => setPhone(text.replace(/[^\d+]/g, ""))}
            placeholder="10-digit mobile"
            keyboardType="phone-pad"
            error={errors.phone}
            delay={120}
          />
          <Field
            label="PAN"
            value={pan}
            onChangeText={(text) => setPan(text.toUpperCase())}
            placeholder="ABCDE1234F"
            autoCapitalize="characters"
            maxLength={10}
            error={errors.pan}
            delay={160}
          />

          <AnimatePresence exitBeforeEnter>
            {method === "BANK" ? (
              <MotiView
                key="bank"
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0, translateY: -8 }}
                transition={{ type: "timing", duration: 260 }}
              >
                <Field
                  label="Account number"
                  value={bankAccount}
                  onChangeText={(text) => setBankAccount(text.replace(/[^\d]/g, ""))}
                  placeholder="Bank account number"
                  keyboardType="number-pad"
                  maxLength={18}
                  error={errors.bankAccount}
                />
                <Field
                  label="IFSC"
                  value={ifsc}
                  onChangeText={(text) => setIfsc(text.toUpperCase())}
                  placeholder="HDFC0001234"
                  autoCapitalize="characters"
                  maxLength={11}
                  error={errors.ifsc}
                  delay={60}
                />
              </MotiView>
            ) : (
              <MotiView
                key="upi"
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0, translateY: -8 }}
                transition={{ type: "timing", duration: 260 }}
              >
                <Field
                  label="UPI ID"
                  value={upi}
                  onChangeText={(text) => setUpi(text.trim())}
                  placeholder="name@bank"
                  autoCapitalize="none"
                  error={errors.upi}
                />
              </MotiView>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {serverError ? (
              <MotiView
                from={{ opacity: 0, translateY: -4 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0 }}
                className="mb-3"
              >
                <Text className="text-danger font-sans-medium text-sm">{serverError}</Text>
              </MotiView>
            ) : null}
          </AnimatePresence>

          <View className="mt-1">
            <SubmitButton
              phase={phase}
              disabled={!filled}
              label={data.onboarded ? "Save payout details" : "Activate payouts"}
              onPress={onSubmit}
            />
          </View>

          {data.onboarded ? (
            <Pressable
              onPress={() => {
                setEditing(false)
                setErrors({})
                setServerError("")
                setBankAccount("")
              }}
              className="h-11 items-center justify-center mt-2"
            >
              <Text variant="label" className="text-sm text-muted">
                Cancel
              </Text>
            </Pressable>
          ) : null}

          <View className="flex-row items-start gap-2 mt-4">
            <ShieldCheck size={14} color={colors.muted} style={{ marginTop: 1 }} />
            <Text variant="muted" className="text-xs flex-1 leading-relaxed">
              Your bank details are encrypted and used only to settle your earnings.
            </Text>
          </View>
        </MotiView>
      ) : (
        <MotiView
          key="active"
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: -8 }}
          transition={{ type: "spring", damping: 22, stiffness: 190 }}
          className="bg-surface rounded-3xl border border-line p-5"
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2.5">
              <MotiView
                from={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 13, stiffness: 200 }}
                className="w-9 h-9 rounded-full bg-success/15 items-center justify-center"
              >
                <Check size={18} color={colors.success} strokeWidth={3} />
              </MotiView>
              <Text variant="heading" className="text-xl">
                Payouts active
              </Text>
            </View>
            <KycBadge status={data.vendorKycStatus} />
          </View>

          <Text variant="muted" className="text-sm leading-relaxed mb-4">
            Vision Menu collects each payment and settles your earnings straight to this account.
          </Text>

          <View className="bg-canvas rounded-2xl border border-line px-4 py-4 gap-4">
            {data.payoutUpi ? (
              <DestinationRow Icon={Smartphone} label="UPI ID" value={data.payoutUpi} />
            ) : data.hasBankAccount ? (
              <>
                <DestinationRow Icon={Landmark} label="Bank account" value="•••• •••• ••••" />
                {data.payoutIfsc ? <DestinationRow label="IFSC" value={data.payoutIfsc} /> : null}
              </>
            ) : (
              <DestinationRow Icon={Landmark} label="Destination" value="Awaiting details" />
            )}
          </View>

          {data.vendorKycStatus === "REJECTED" ? (
            <View className="flex-row items-start gap-2 mt-4 bg-danger/10 rounded-2xl p-3.5">
              <AlertTriangle size={15} color={colors.danger} style={{ marginTop: 1 }} />
              <Text variant="muted" className="text-sm flex-1 leading-relaxed">
                Your payout details need attention. Update them below to keep receiving settlements.
              </Text>
            </View>
          ) : null}

          <View className="mt-5">
            <Button
              title="Update payout details"
              variant="outline"
              onPress={() => {
                setErrors({})
                setServerError("")
                setEditing(true)
              }}
            />
          </View>
        </MotiView>
      )}
    </AnimatePresence>
  )
}
