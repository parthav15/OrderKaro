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
import { ArrowLeft, Bike, Receipt, Check, Building2, Sparkles, Info, UserCheck, Phone, X } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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

interface Exemption {
  id: string
  phone: string
  label: string | null
  createdAt: string
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

function ExemptionsSection({ rid }: { rid: string | undefined }) {
  const { colors } = useTheme()
  const queryClient = useQueryClient()
  const [phone, setPhone] = useState("")
  const [label, setLabel] = useState("")
  const [formError, setFormError] = useState("")

  const { data: exemptions, isLoading } = useQuery({
    queryKey: ["delivery-exemptions", rid],
    queryFn: () => ownerApi.get<Exemption[]>(`/api/v1/restaurants/${rid}/delivery-exemptions`),
    enabled: !!rid,
  })

  const add = useMutation({
    mutationFn: () =>
      ownerApi.post(`/api/v1/restaurants/${rid}/delivery-exemptions`, {
        phone: phone.replace(/\D/g, ""),
        label: label.trim() || undefined,
      }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      queryClient.invalidateQueries({ queryKey: ["delivery-exemptions", rid] })
      setPhone("")
      setLabel("")
      setFormError("")
    },
    onError: (e) => setFormError(e instanceof Error ? e.message : "Couldn't add that number"),
  })

  const remove = useMutation({
    mutationFn: (id: string) =>
      ownerApi.delete(`/api/v1/restaurants/${rid}/delivery-exemptions/${id}`),
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      queryClient.invalidateQueries({ queryKey: ["delivery-exemptions", rid] })
    },
  })

  const digits = phone.replace(/\D/g, "")
  const canAdd = digits.length >= 10 && !add.isPending
  const list = exemptions ?? []

  return (
    <Card delay={300} className="mt-8">
      <View className="flex-row items-center gap-3">
        <View className="w-11 h-11 rounded-2xl bg-canvas border border-line items-center justify-center">
          <UserCheck size={19} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text variant="title" className="text-base">
            Delivery fee exemptions
          </Text>
          <Text variant="muted" className="text-xs mt-0.5 leading-relaxed">
            Diners who order delivery with an exempt phone pay ₹0 delivery & handling.
          </Text>
        </View>
      </View>

      <View className="mt-4">
        {isLoading ? (
          <View className="py-8 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : list.length === 0 ? (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 260 }}
            className="items-center py-7 rounded-2xl bg-canvas border border-dashed border-line"
          >
            <Text variant="muted" className="text-sm">
              No exempt numbers yet.
            </Text>
          </MotiView>
        ) : (
          <View className="gap-2">
            <AnimatePresence>
              {list.map((ex, i) => {
                const removing = remove.isPending && remove.variables === ex.id
                return (
                  <MotiView
                    key={ex.id}
                    from={{ opacity: 0, translateY: -6 }}
                    animate={{ opacity: removing ? 0.5 : 1, translateY: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "timing", duration: 220, delay: i * 30 }}
                    className="flex-row items-center gap-3 rounded-2xl bg-canvas border border-line px-4 py-3"
                  >
                    <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center">
                      <Phone size={15} color={colors.primary} />
                    </View>
                    <View className="flex-1">
                      <Text variant="label" className="text-sm">
                        {ex.phone}
                      </Text>
                      {ex.label ? (
                        <Text variant="muted" className="text-xs mt-0.5">
                          {ex.label}
                        </Text>
                      ) : null}
                    </View>
                    <Pressable
                      disabled={removing}
                      onPress={() => remove.mutate(ex.id)}
                      hitSlop={8}
                      className="w-8 h-8 rounded-full bg-surface border border-line items-center justify-center"
                    >
                      {removing ? (
                        <ActivityIndicator size="small" color={colors.muted} />
                      ) : (
                        <X size={15} color={colors.muted} />
                      )}
                    </Pressable>
                  </MotiView>
                )
              })}
            </AnimatePresence>
          </View>
        )}
      </View>

      <View className="h-px bg-line my-4" />

      <Text variant="muted" className="text-xs uppercase tracking-widest mb-2">
        Add a number
      </Text>
      <View className="gap-2">
        <View className="flex-row items-center h-14 rounded-2xl bg-canvas border border-line px-5">
          <Phone size={16} color={colors.muted} />
          <TextInput
            value={phone}
            onChangeText={(t) => {
              if (formError) setFormError("")
              setPhone(t.replace(/[^\d]/g, ""))
            }}
            placeholder="Phone number"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            maxLength={15}
            className="flex-1 h-full ml-3 text-ink font-sans-medium text-base"
          />
        </View>
        <TextInput
          value={label}
          onChangeText={setLabel}
          placeholder="Label (optional)"
          placeholderTextColor={colors.muted}
          maxLength={80}
          className="h-14 rounded-2xl bg-canvas border border-line px-5 text-ink font-sans-medium text-base"
        />
      </View>

      <AnimatePresence>
        {formError ? (
          <MotiView
            key="exemption-error"
            from={{ opacity: 0, translateY: -4 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -4 }}
            transition={{ type: "timing", duration: 200 }}
          >
            <Text className="text-danger font-sans-medium text-xs mt-2">{formError}</Text>
          </MotiView>
        ) : null}
      </AnimatePresence>

      <View className="mt-3">
        <Button
          title="Add number"
          loading={add.isPending}
          disabled={!canAdd}
          onPress={() => {
            setFormError("")
            add.mutate()
          }}
        />
      </View>
    </Card>
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

            <ExemptionsSection rid={rid} />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
