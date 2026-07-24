import { useEffect, useState } from "react"
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  type LayoutChangeEvent,
} from "react-native"
import { useRouter } from "expo-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { SafeAreaView } from "react-native-safe-area-context"
import { MotiView, AnimatePresence } from "moti"
import * as Haptics from "expo-haptics"
import { ArrowLeft, Bike, Receipt, Check, Building2, Sparkles, Info } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Card } from "@/components/ui/card"
import { ownerApi } from "@/lib/owner-api"
import { useOwnerRestaurant } from "@/lib/use-owner-restaurant"
import { useTheme } from "@/theme/theme-provider"

type FeeMode = "FLAT" | "PERCENT"
type Beneficiary = "RESTAURANT" | "PLATFORM"

interface FeeConfig {
  deliveryFeeEnabled: boolean
  deliveryFeeMode: FeeMode
  deliveryFeeAmount: number
  deliveryFeeBeneficiary: Beneficiary
  convenienceFeeEnabled: boolean
  convenienceFeeMode: FeeMode
  convenienceFeeAmount: number
  convenienceFeeBeneficiary: Beneficiary
}

type IconType = React.ComponentType<{ size?: number; color?: string }>

const SAMPLE_ORDER = 500

function money(v: number) {
  return `₹${Math.round(v).toLocaleString("en-IN")}`
}

function formatAmount(v: number | undefined, mode: FeeMode | undefined) {
  if (!v || v <= 0) return ""
  if (mode === "PERCENT") return String(v)
  return String(Math.round(v))
}

function sanitizeAmount(text: string, mode: FeeMode) {
  if (mode === "PERCENT") {
    const cleaned = text.replace(/[^\d.]/g, "")
    const [whole, ...rest] = cleaned.split(".")
    const joined = rest.length ? `${whole}.${rest.join("")}` : cleaned
    return Number(joined) > 100 ? "100" : joined
  }
  return text.replace(/[^\d]/g, "")
}

function contribution(enabled: boolean, mode: FeeMode, amount: string) {
  if (!enabled) return 0
  const n = Number(amount) || 0
  if (n <= 0) return 0
  return mode === "PERCENT" ? (SAMPLE_ORDER * n) / 100 : n
}

function ModeToggle({ value, onChange }: { value: FeeMode; onChange: (m: FeeMode) => void }) {
  const { colors } = useTheme()
  const [width, setWidth] = useState(0)
  const half = width > 0 ? (width - 8) / 2 : 0
  const options: { value: FeeMode; label: string }[] = [
    { value: "FLAT", label: "Flat" },
    { value: "PERCENT", label: "Percent" },
  ]

  function onLayout(e: LayoutChangeEvent) {
    setWidth(e.nativeEvent.layout.width)
  }

  return (
    <View onLayout={onLayout} className="relative flex-row h-12 rounded-2xl bg-canvas border border-line p-1">
      {half > 0 ? (
        <MotiView
          animate={{ translateX: value === "FLAT" ? 0 : half }}
          transition={{ type: "spring", damping: 18, stiffness: 220 }}
          style={{ position: "absolute", top: 4, bottom: 4, left: 4, width: half }}
          className="rounded-xl bg-primary"
        />
      ) : null}
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              if (!active) Haptics.selectionAsync()
              onChange(opt.value)
            }}
            className="flex-1 items-center justify-center"
          >
            <Text variant="label" className="text-sm" style={{ color: active ? colors.onPrimary : colors.muted }}>
              {opt.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function AmountField({
  mode,
  value,
  onChangeText,
  invalid,
}: {
  mode: FeeMode
  value: string
  onChangeText: (t: string) => void
  invalid: boolean
}) {
  const { colors } = useTheme()
  const isPercent = mode === "PERCENT"
  return (
    <View
      className={`flex-row items-center h-14 rounded-2xl bg-canvas border px-5 ${
        invalid ? "border-danger" : "border-line"
      }`}
    >
      {!isPercent ? (
        <Text variant="label" className="text-base text-muted mr-2">
          ₹
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="0"
        placeholderTextColor={colors.muted}
        keyboardType={isPercent ? "decimal-pad" : "number-pad"}
        className="flex-1 h-full text-ink font-sans-medium text-base"
      />
      {isPercent ? (
        <Text variant="label" className="text-base text-muted ml-2">
          %
        </Text>
      ) : null}
    </View>
  )
}

function BeneficiaryLine({ who }: { who: Beneficiary }) {
  const { colors } = useTheme()
  const isRestaurant = who === "RESTAURANT"
  const Icon = isRestaurant ? Building2 : Sparkles
  return (
    <View className="flex-row items-center gap-1.5 mt-3">
      <Icon size={13} color={colors.muted} />
      <Text variant="muted" className="text-xs">
        Collected by: {isRestaurant ? "Your account" : "Vision Menu"}
      </Text>
    </View>
  )
}

function FeeBlock({
  icon: Icon,
  title,
  subtitle,
  enabled,
  onToggle,
  mode,
  onMode,
  amount,
  onAmount,
  beneficiary,
  delay,
}: {
  icon: IconType
  title: string
  subtitle: string
  enabled: boolean
  onToggle: (next: boolean) => void
  mode: FeeMode
  onMode: (m: FeeMode) => void
  amount: string
  onAmount: (t: string) => void
  beneficiary: Beneficiary
  delay: number
}) {
  const { colors } = useTheme()
  const invalid = enabled && !(Number(amount) > 0)
  return (
    <Card delay={delay} className="mb-4 overflow-hidden">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-3 pr-3">
          <View className="w-11 h-11 rounded-2xl bg-canvas border border-line items-center justify-center">
            <Icon size={19} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text variant="title" className="text-base">
              {title}
            </Text>
            <Text variant="muted" className="text-xs mt-0.5">
              {subtitle}
            </Text>
          </View>
        </View>
        <Switch
          value={enabled}
          onValueChange={(next) => {
            Haptics.selectionAsync()
            onToggle(next)
          }}
          trackColor={{ false: colors.line, true: colors.primary }}
          thumbColor={colors.onPrimary}
        />
      </View>

      <AnimatePresence>
        {enabled ? (
          <MotiView
            from={{ opacity: 0, translateY: -8 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -8 }}
            transition={{ type: "timing", duration: 240 }}
            className="mt-4"
          >
            <ModeToggle value={mode} onChange={onMode} />
            <View className="mt-3">
              <AmountField mode={mode} value={amount} onChangeText={onAmount} invalid={invalid} />
            </View>
            {invalid ? (
              <Text className="text-danger font-sans-medium text-xs mt-2">
                Enter an amount above zero.
              </Text>
            ) : null}
            <BeneficiaryLine who={beneficiary} />
          </MotiView>
        ) : null}
      </AnimatePresence>
    </Card>
  )
}

function SaveButton({
  loading,
  saved,
  disabled,
  onPress,
}: {
  loading: boolean
  saved: boolean
  disabled: boolean
  onPress: () => void
}) {
  const { colors } = useTheme()
  const [pressed, setPressed] = useState(false)
  const isDisabled = disabled || loading || saved
  const state = loading ? "loading" : saved ? "saved" : "idle"

  return (
    <Pressable
      disabled={isDisabled}
      onPressIn={() => {
        setPressed(true)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
    >
      <MotiView
        animate={{ scale: pressed ? 0.97 : 1, opacity: disabled && !loading && !saved ? 0.55 : 1 }}
        transition={{ type: "timing", duration: 140 }}
        className="relative h-14 rounded-2xl items-center justify-center overflow-hidden bg-primary"
      >
        <AnimatePresence>
          {state === "loading" ? (
            <MotiView
              key="loading"
              from={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: "timing", duration: 160 }}
              className="absolute inset-0 items-center justify-center"
            >
              <ActivityIndicator color={colors.onPrimary} />
            </MotiView>
          ) : state === "saved" ? (
            <MotiView
              key="saved"
              from={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: "spring", damping: 13, stiffness: 240 }}
              className="absolute inset-0 flex-row items-center justify-center gap-2"
            >
              <Check size={19} color={colors.onPrimary} />
              <Text variant="label" className="text-base" style={{ color: colors.onPrimary }}>
                Saved
              </Text>
            </MotiView>
          ) : (
            <MotiView
              key="idle"
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "timing", duration: 160 }}
              className="absolute inset-0 items-center justify-center"
            >
              <Text variant="label" className="text-base" style={{ color: colors.onPrimary }}>
                Save fees
              </Text>
            </MotiView>
          )}
        </AnimatePresence>
      </MotiView>
    </Pressable>
  )
}

export default function OwnerFees() {
  const router = useRouter()
  const { colors } = useTheme()
  const queryClient = useQueryClient()
  const { restaurant } = useOwnerRestaurant()
  const rid = restaurant?.id

  const [deliveryEnabled, setDeliveryEnabled] = useState(false)
  const [deliveryMode, setDeliveryMode] = useState<FeeMode>("FLAT")
  const [deliveryAmount, setDeliveryAmount] = useState("")
  const [convenienceEnabled, setConvenienceEnabled] = useState(false)
  const [convenienceMode, setConvenienceMode] = useState<FeeMode>("FLAT")
  const [convenienceAmount, setConvenienceAmount] = useState("")
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["owner-fee-config", rid],
    queryFn: () => ownerApi.get<FeeConfig>(`/api/v1/restaurants/${rid}/fee-config`),
    enabled: !!rid,
  })

  useEffect(() => {
    if (!data) return
    setDeliveryEnabled(!!data.deliveryFeeEnabled)
    setDeliveryMode(data.deliveryFeeMode ?? "FLAT")
    setDeliveryAmount(formatAmount(data.deliveryFeeAmount, data.deliveryFeeMode))
    setConvenienceEnabled(!!data.convenienceFeeEnabled)
    setConvenienceMode(data.convenienceFeeMode ?? "FLAT")
    setConvenienceAmount(formatAmount(data.convenienceFeeAmount, data.convenienceFeeMode))
  }, [data])

  function changeDeliveryMode(m: FeeMode) {
    setDeliveryMode(m)
    setDeliveryAmount((a) => sanitizeAmount(a, m))
  }
  function changeConvenienceMode(m: FeeMode) {
    setConvenienceMode(m)
    setConvenienceAmount((a) => sanitizeAmount(a, m))
  }

  const deliveryValid = !deliveryEnabled || Number(deliveryAmount) > 0
  const convenienceValid = !convenienceEnabled || Number(convenienceAmount) > 0
  const canSave = deliveryValid && convenienceValid

  const save = useMutation({
    mutationFn: () =>
      ownerApi.put(`/api/v1/restaurants/${rid}/fee-config`, {
        deliveryFeeEnabled: deliveryEnabled,
        deliveryFeeMode: deliveryMode,
        deliveryFeeAmount: Number(deliveryAmount) || 0,
        convenienceFeeEnabled: convenienceEnabled,
        convenienceFeeMode: convenienceMode,
        convenienceFeeAmount: Number(convenienceAmount) || 0,
      }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      queryClient.invalidateQueries({ queryKey: ["owner-fee-config", rid] })
      setSaved(true)
      setTimeout(() => setSaved(false), 1600)
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not save fees"),
  })

  const anyEnabled = deliveryEnabled || convenienceEnabled
  const combined =
    contribution(deliveryEnabled, deliveryMode, deliveryAmount) +
    contribution(convenienceEnabled, convenienceMode, convenienceAmount)

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <View className="flex-row items-center gap-3 px-5 pb-3">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-surface border border-line items-center justify-center"
          >
            <ArrowLeft size={18} color={colors.ink} />
          </Pressable>
          <Text variant="heading" className="text-2xl">
            Fees
          </Text>
        </View>

        {isLoading || !data ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ padding: 20, paddingTop: 6, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            <MotiView
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 420 }}
              className="flex-row gap-3 bg-surface-elevated rounded-3xl border border-line p-4 mb-5"
            >
              <Info size={17} color={colors.accent} />
              <Text variant="muted" className="flex-1 text-sm leading-relaxed">
                Extra charges added to delivery orders. Customers see one “Delivery & handling” line.
              </Text>
            </MotiView>

            <FeeBlock
              icon={Bike}
              title="Delivery fee"
              subtitle="Covers the trip to the customer"
              enabled={deliveryEnabled}
              onToggle={setDeliveryEnabled}
              mode={deliveryMode}
              onMode={changeDeliveryMode}
              amount={deliveryAmount}
              onAmount={(t) => setDeliveryAmount(sanitizeAmount(t, deliveryMode))}
              beneficiary={data.deliveryFeeBeneficiary}
              delay={60}
            />

            <FeeBlock
              icon={Receipt}
              title="Convenience fee"
              subtitle="Platform & handling charge"
              enabled={convenienceEnabled}
              onToggle={setConvenienceEnabled}
              mode={convenienceMode}
              onMode={changeConvenienceMode}
              amount={convenienceAmount}
              onAmount={(t) => setConvenienceAmount(sanitizeAmount(t, convenienceMode))}
              beneficiary={data.convenienceFeeBeneficiary}
              delay={120}
            />

            <Card delay={180} className="mb-5">
              <Text variant="muted" className="text-xs tracking-widest uppercase mb-3">
                What customers see
              </Text>
              {!anyEnabled ? (
                <Text variant="muted" className="text-sm leading-relaxed">
                  No extra charges. Customers pay the item total on delivery orders.
                </Text>
              ) : (
                <View>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text variant="body" className="text-sm">
                      Subtotal
                    </Text>
                    <Text variant="body" className="text-sm">
                      {money(SAMPLE_ORDER)}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between mb-3">
                    <Text variant="body" className="text-sm">
                      Delivery & handling
                    </Text>
                    <Text variant="price" className="text-base">
                      {money(combined)}
                    </Text>
                  </View>
                  <View className="h-px bg-line mb-3" />
                  <View className="flex-row items-center justify-between">
                    <Text variant="title" className="text-base">
                      Total
                    </Text>
                    <Text variant="title" className="text-base">
                      {money(SAMPLE_ORDER + combined)}
                    </Text>
                  </View>
                  <Text variant="muted" className="text-xs mt-3">
                    Example on a {money(SAMPLE_ORDER)} delivery order.
                  </Text>
                </View>
              )}
            </Card>

            {error ? <Text className="text-danger font-sans-medium text-sm mb-3">{error}</Text> : null}

            <MotiView
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 180, delay: 240 }}
            >
              <SaveButton
                loading={save.isPending}
                saved={saved}
                disabled={!canSave}
                onPress={() => {
                  setError("")
                  save.mutate()
                }}
              />
            </MotiView>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
