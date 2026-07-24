import { useEffect, useRef, useState, type ReactNode } from "react"
import { View, Pressable, ActivityIndicator } from "react-native"
import { MotiView, AnimatePresence } from "moti"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import * as Haptics from "expo-haptics"
import * as WebBrowser from "expo-web-browser"
import * as Linking from "expo-linking"
import {
  Sparkles,
  ShieldCheck,
  Check,
  Clock,
  ExternalLink,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { useTheme } from "@/theme/theme-provider"
import { ownerApi } from "@/lib/owner-api"
import type { OwnerRestaurant } from "@/lib/types"

interface StripeConnectStatus {
  connected: boolean
  onboarded: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  collectionMode: "BYO" | "MARKETPLACE"
}

interface StripeConnectStart {
  onboardingUrl: string
  accountId: string
}

function Eyebrow() {
  const { colors } = useTheme()
  return (
    <View className="flex-row items-center gap-2 mb-3">
      <Sparkles size={14} color={colors.accent} />
      <Text className="text-accent tracking-[3px] text-[11px] font-sans-semibold">PAYOUTS</Text>
    </View>
  )
}

function Reveal({ delay = 0, children }: { delay?: number; children: ReactNode }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 380, delay }}
    >
      {children}
    </MotiView>
  )
}

function ErrorNote({ message }: { message: string }) {
  return (
    <AnimatePresence>
      {message ? (
        <MotiView
          from={{ opacity: 0, translateY: -4 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0 }}
          transition={{ type: "timing", duration: 220 }}
          className="mt-3"
        >
          <Text className="text-danger font-sans-medium text-sm">{message}</Text>
        </MotiView>
      ) : null}
    </AnimatePresence>
  )
}

function StatusChip({ label, active, delay }: { label: string; active: boolean; delay: number }) {
  const { colors } = useTheme()
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10, scale: 0.9 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: "spring", damping: 18, stiffness: 220, delay }}
      className={`flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 ${
        active ? "bg-success/15 border-success/30" : "bg-canvas border-line"
      }`}
    >
      <AnimatePresence exitBeforeEnter>
        {active ? (
          <MotiView
            key="on"
            from={{ scale: 0, rotate: "-40deg" }}
            animate={{ scale: 1, rotate: "0deg" }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 260 }}
          >
            <Check size={13} color={colors.success} strokeWidth={3} />
          </MotiView>
        ) : (
          <MotiView
            key="off"
            from={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "timing", duration: 200 }}
          >
            <Clock size={13} color={colors.muted} />
          </MotiView>
        )}
      </AnimatePresence>
      <Text
        variant="label"
        className="text-xs"
        style={{ color: active ? colors.success : colors.muted }}
      >
        {label}
      </Text>
    </MotiView>
  )
}

function ChipRow({ status }: { status: StripeConnectStatus }) {
  const chips = [
    { label: "Charges enabled", active: status.chargesEnabled },
    { label: "Payouts enabled", active: status.payoutsEnabled },
    { label: "Details submitted", active: status.detailsSubmitted },
  ]
  return (
    <View className="flex-row flex-wrap gap-2">
      {chips.map((chip, index) => (
        <StatusChip key={chip.label} label={chip.label} active={chip.active} delay={140 + index * 90} />
      ))}
    </View>
  )
}

function ActionButton({
  label,
  Icon,
  loading,
  variant = "primary",
  onPress,
}: {
  label: string
  Icon: typeof ShieldCheck
  loading: boolean
  variant?: "primary" | "outline"
  onPress: () => void
}) {
  const { colors } = useTheme()
  const [pressed, setPressed] = useState(false)
  const isPrimary = variant === "primary"
  const labelColor = isPrimary ? colors.onPrimary : colors.ink
  return (
    <Pressable
      disabled={loading}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
    >
      <MotiView
        animate={{ scale: pressed ? 0.97 : 1, opacity: loading ? 0.9 : 1 }}
        transition={{ type: "timing", duration: 160 }}
        className={`h-14 rounded-2xl flex-row items-center justify-center gap-2 px-6 ${
          isPrimary ? "bg-primary" : "bg-transparent border border-line"
        }`}
      >
        <AnimatePresence exitBeforeEnter>
          {loading ? (
            <MotiView
              key="spinner"
              from={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: "timing", duration: 180 }}
            >
              <ActivityIndicator color={labelColor} />
            </MotiView>
          ) : (
            <MotiView
              key="content"
              from={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: "timing", duration: 180 }}
              className="flex-row items-center gap-2"
            >
              <Text variant="label" className="text-base" style={{ color: labelColor }}>
                {label}
              </Text>
              <Icon size={17} color={labelColor} />
            </MotiView>
          )}
        </AnimatePresence>
      </MotiView>
    </Pressable>
  )
}

export function StripeConnectOnboarding({ restaurant }: { restaurant?: OwnerRestaurant }) {
  const { colors } = useTheme()
  const queryClient = useQueryClient()
  const rid = restaurant?.id
  const queryKey = ["owner-stripe-connect", rid]

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const previousCharges = useRef<boolean | null>(null)

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => ownerApi.get<StripeConnectStatus>(`/api/v1/restaurants/${rid}/stripe-connect`),
    enabled: !!rid,
  })

  useEffect(() => {
    if (!data) return
    if (data.chargesEnabled && previousCharges.current === false) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
    previousCharges.current = data.chargesEnabled
  }, [data])

  async function launch() {
    if (!rid || busy) return
    setError("")
    setBusy(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    try {
      const start = await ownerApi.post<StripeConnectStart>(
        `/api/v1/restaurants/${rid}/stripe-connect`
      )
      const redirectUrl = Linking.createURL("payments")
      try {
        await WebBrowser.openAuthSessionAsync(start.onboardingUrl, redirectUrl)
      } catch {
        await WebBrowser.openBrowserAsync(start.onboardingUrl)
      }
      await queryClient.invalidateQueries({ queryKey })
    } catch (issue) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      setError(issue instanceof Error ? issue.message : "Couldn't open Stripe onboarding")
    } finally {
      setBusy(false)
    }
  }

  if (!rid || isLoading || !data) {
    return (
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-surface rounded-3xl border border-line p-5 h-44 items-center justify-center"
      >
        <ActivityIndicator color={colors.primary} />
      </MotiView>
    )
  }

  const status = data
  const stage = status.chargesEnabled ? "active" : status.connected ? "incomplete" : "intro"

  return (
    <AnimatePresence exitBeforeEnter>
      {stage === "active" ? (
        <MotiView
          key="active"
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: -8 }}
          transition={{ type: "spring", damping: 22, stiffness: 190 }}
          className="bg-surface rounded-3xl border border-line p-5"
        >
          <Eyebrow />
          <View className="flex-row items-center gap-2.5 mb-3">
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
          <Reveal delay={60}>
            <Text variant="muted" className="text-sm leading-relaxed mb-5">
              Vision Menu collects each payment and settles your earnings straight to your connected
              Stripe account.
            </Text>
          </Reveal>
          <ChipRow status={status} />
          <View className="mt-6">
            <ActionButton
              label="Manage on Stripe"
              Icon={ExternalLink}
              variant="outline"
              loading={busy}
              onPress={launch}
            />
          </View>
          <ErrorNote message={error} />
        </MotiView>
      ) : stage === "incomplete" ? (
        <MotiView
          key="incomplete"
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: -8 }}
          transition={{ type: "spring", damping: 22, stiffness: 190 }}
          className="bg-surface rounded-3xl border border-line p-5"
        >
          <Eyebrow />
          <View className="flex-row items-center gap-2.5 mb-3">
            <MotiView
              from={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 13, stiffness: 200 }}
              className="w-9 h-9 rounded-full bg-warning/15 items-center justify-center"
            >
              <AlertTriangle size={17} color={colors.warning} />
            </MotiView>
            <Text variant="heading" className="text-xl">
              Setup incomplete
            </Text>
          </View>
          <Reveal delay={60}>
            <Text variant="muted" className="text-sm leading-relaxed mb-5">
              Your Stripe account is connected, but a few details are still needed before payouts can
              go live. Pick up right where you left off.
            </Text>
          </Reveal>
          <ChipRow status={status} />
          <View className="mt-6">
            <ActionButton
              label="Continue on Stripe"
              Icon={ArrowUpRight}
              loading={busy}
              onPress={launch}
            />
          </View>
          <ErrorNote message={error} />
        </MotiView>
      ) : (
        <MotiView
          key="intro"
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: -8 }}
          transition={{ type: "spring", damping: 22, stiffness: 190 }}
          className="bg-surface rounded-3xl border border-line p-5"
        >
          <Eyebrow />
          <Reveal delay={60}>
            <Text variant="heading" className="text-2xl leading-tight mb-2">
              Get paid by Vision Menu
            </Text>
          </Reveal>
          <Reveal delay={120}>
            <Text variant="muted" className="text-sm leading-relaxed mb-5">
              You keep 100% of your menu price. Vision Menu collects each payment and settles your
              earnings straight to your connected account.
            </Text>
          </Reveal>
          <Reveal delay={180}>
            <ActionButton
              label="Connect payouts with Stripe"
              Icon={ArrowUpRight}
              loading={busy}
              onPress={launch}
            />
          </Reveal>
          <ErrorNote message={error} />
          <Reveal delay={240}>
            <View className="flex-row items-start gap-2 mt-4">
              <ShieldCheck size={14} color={colors.muted} style={{ marginTop: 1 }} />
              <Text variant="muted" className="text-xs flex-1 leading-relaxed">
                You'll finish setup on Stripe's secure page and come right back.
              </Text>
            </View>
          </Reveal>
        </MotiView>
      )}
    </AnimatePresence>
  )
}
