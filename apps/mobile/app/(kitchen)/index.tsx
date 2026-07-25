import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { View, ScrollView, Pressable, ActivityIndicator } from "react-native"
import { useRouter, type Href } from "expo-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MotiView } from "moti"
import { SafeAreaView } from "react-native-safe-area-context"
import * as Haptics from "expo-haptics"
import * as Linking from "expo-linking"
import { useAudioPlayer } from "expo-audio"
import {
  ChefHat,
  HandPlatter,
  LogOut,
  ArrowLeft,
  User,
  Phone,
  Clock,
  AlertTriangle,
  Volume2,
  VolumeX,
  Bell,
  Flame,
  CheckCircle2,
  UtensilsCrossed,
} from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { Screen } from "@/components/ui/screen"
import { Card } from "@/components/ui/card"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { ownerApi } from "@/lib/owner-api"
import { getOwnerToken, ownerSignOut } from "@/lib/owner-auth"
import { staffApi } from "@/lib/staff-api"
import { getStaffProfile, staffSignOut } from "@/lib/staff-auth"
import { useTheme } from "@/theme/theme-provider"
import type { OwnerRestaurant, ActiveOrder, OrderStatus } from "@/lib/types"
import { STALE_ORDER_MINUTES } from "@orderkaro/shared"

type Mode = "KITCHEN" | "COUNTER"

const KITCHEN_NEXT: Partial<Record<OrderStatus, { label: string; to: OrderStatus }>> = {
  PLACED: { label: "Accept", to: "ACCEPTED" },
  ACCEPTED: { label: "Start", to: "PREPARING" },
  PREPARING: { label: "Ready", to: "READY" },
}

function minutesSince(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / 60000
}

function elapsedLabel(iso: string) {
  const minutes = Math.floor(minutesSince(iso))
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`
}

function destinationLabel(order: ActiveOrder) {
  if (order.orderType === "TAKEAWAY") return "Takeaway"
  if (order.orderType === "DELIVERY") {
    return order.deliveryLocation ? `Delivery — ${order.deliveryLocation}` : "Delivery"
  }
  return order.table?.label || "Takeaway"
}

function callPhone(phone: string) {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  Linking.openURL(`tel:${phone}`).catch(() => {})
}

function UrgencyBadge({ placedAt }: { placedAt: string }) {
  const { colors } = useTheme()
  const minutes = minutesSince(placedAt)
  const isUrgent = minutes > STALE_ORDER_MINUTES.URGENT
  const isWarning = minutes > STALE_ORDER_MINUTES.WARNING

  if (isUrgent) {
    return (
      <MotiView
        from={{ opacity: 1 }}
        animate={{ opacity: 0.5 }}
        transition={{ type: "timing", duration: 650, loop: true }}
        className="flex-row items-center gap-1.5 bg-primary/15 border border-primary rounded-xl px-2.5 py-1"
      >
        <AlertTriangle size={13} color={colors.primary} />
        <Text className="text-[11px] font-sans-bold text-primary">
          VERY LATE — {Math.floor(minutes)}m
        </Text>
      </MotiView>
    )
  }

  if (isWarning) {
    return (
      <View className="flex-row items-center gap-1.5 bg-line rounded-xl px-2.5 py-1">
        <Clock size={13} color={colors.ink} />
        <Text className="text-[11px] font-sans-bold text-ink">
          Waiting — {Math.floor(minutes)}m
        </Text>
      </View>
    )
  }

  return (
    <View className="flex-row items-center gap-1.5 bg-surface-elevated rounded-xl px-2.5 py-1">
      <Clock size={13} color={colors.muted} />
      <Text variant="muted" className="text-[11px]">
        {elapsedLabel(placedAt)}
      </Text>
    </View>
  )
}

function SoundToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  const { colors } = useTheme()
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync()
        onToggle()
      }}
      hitSlop={10}
      className="w-11 h-11 rounded-full items-center justify-center bg-surface border border-line"
    >
      <MotiView
        key={String(enabled)}
        from={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "timing", duration: 220 }}
      >
        {enabled ? (
          <Volume2 size={18} color={colors.primary} />
        ) : (
          <VolumeX size={18} color={colors.muted} />
        )}
      </MotiView>
    </Pressable>
  )
}

function SectionHeader({
  icon,
  label,
  count,
  tint,
}: {
  icon: ReactNode
  label: string
  count: number
  tint: string
}) {
  return (
    <View className={`flex-row items-center justify-between px-4 py-3 rounded-2xl mb-3 ${tint}`}>
      <View className="flex-row items-center gap-2.5">
        {icon}
        <Text variant="title" className="text-base">
          {label}
        </Text>
      </View>
      <MotiView
        key={count}
        from={{ opacity: 0, translateY: -6, scale: 0.85 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{ type: "spring", damping: 18, stiffness: 260 }}
      >
        <Text variant="heading" className="text-2xl">
          {count}
        </Text>
      </MotiView>
    </View>
  )
}

function EmptySection({ label }: { label: string }) {
  const { colors } = useTheme()
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "timing", duration: 300 }}
      className="items-center py-10 gap-3"
    >
      <UtensilsCrossed size={28} color={colors.muted} />
      <Text variant="muted" className="text-sm">
        {label}
      </Text>
    </MotiView>
  )
}

function CustomerLine({ name, phone }: { name: string; phone: string | undefined }) {
  const { colors } = useTheme()
  return (
    <View className="flex-row items-center justify-between flex-wrap gap-2 mb-3">
      <View className="flex-row items-center gap-1.5">
        <User size={15} color={colors.muted} />
        <Text variant="title" className="text-base">
          {name}
        </Text>
      </View>
      {phone ? (
        <Pressable onPress={() => callPhone(phone)} hitSlop={8} className="flex-row items-center gap-1">
          <Phone size={13} color={colors.primary} />
          <Text className="text-xs font-sans-bold text-primary">{phone}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

function KitchenTicketCard({
  order,
  next,
  isAdvancing,
  onAdvance,
  index,
}: {
  order: ActiveOrder
  next: { label: string; to: OrderStatus } | null
  isAdvancing: boolean
  onAdvance: () => void
  index: number
}) {
  const { colors } = useTheme()
  const minutes = minutesSince(order.placedAt)
  const borderClass =
    minutes > STALE_ORDER_MINUTES.URGENT
      ? "border-l-primary"
      : minutes > STALE_ORDER_MINUTES.WARNING
        ? "border-l-warning"
        : "border-l-line"

  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 200, delay: index * 40 }}
      className={`bg-surface rounded-3xl border border-line border-l-8 ${borderClass} p-4`}
    >
      <View className="flex-row items-start justify-between mb-3">
        <Text variant="heading" className="text-3xl">
          #{order.orderNumber}
        </Text>
        <UrgencyBadge placedAt={order.placedAt} />
      </View>

      <CustomerLine name={order.consumer?.name ?? "Guest"} phone={order.consumer?.phone} />

      <View className="rounded-full bg-canvas border border-line self-start px-2.5 py-0.5 mb-3">
        <Text variant="muted" className="text-[10px] uppercase tracking-wide">
          {destinationLabel(order)}
        </Text>
      </View>

      <View className="bg-surface-elevated rounded-2xl p-3.5 mb-3 gap-2">
        {order.items.map((it) => (
          <View key={it.id} className="flex-row items-center gap-2.5">
            <Text className="text-lg font-sans-bold text-primary w-7">{it.quantity}×</Text>
            <Text variant="label" className="text-base flex-1">
              {it.menuItem.name}
            </Text>
          </View>
        ))}
      </View>

      {order.specialInstructions ? (
        <View className="flex-row items-start gap-2 bg-warning/10 border border-warning/40 rounded-2xl p-3 mb-3">
          <AlertTriangle size={16} color={colors.warning} style={{ marginTop: 2 }} />
          <View className="flex-1">
            <Text className="text-[10px] font-sans-bold text-warning uppercase tracking-wide mb-0.5">
              Special instructions
            </Text>
            <Text variant="body" className="text-sm leading-relaxed">
              {order.specialInstructions}
            </Text>
          </View>
        </View>
      ) : null}

      {next ? <Button title={next.label} loading={isAdvancing} onPress={onAdvance} /> : null}
    </MotiView>
  )
}

function CounterPickupCard({ order, index }: { order: ActiveOrder; index: number }) {
  const { colors } = useTheme()
  const phone = order.consumer?.phone

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", damping: 18, stiffness: 220, delay: index * 40 }}
      style={{ width: "48%" }}
      className="bg-surface rounded-3xl border-2 border-ink p-5 items-center"
    >
      <MotiView
        from={{ scale: 1 }}
        animate={{ scale: 1.035 }}
        transition={{ type: "timing", duration: 1250, loop: true }}
      >
        <Text variant="heading" className="text-5xl">
          #{order.orderNumber}
        </Text>
      </MotiView>

      <View className="items-center mt-3 mb-1">
        <View className="flex-row items-center gap-2">
          <User size={18} color={colors.muted} />
          <Text variant="title" className="text-xl text-center">
            {order.consumer?.name ?? "Guest"}
          </Text>
        </View>
        {phone ? (
          <Pressable
            onPress={() => callPhone(phone)}
            hitSlop={8}
            className="flex-row items-center gap-1.5 mt-2 bg-primary/10 rounded-full px-3 py-1.5"
          >
            <Phone size={14} color={colors.primary} />
            <Text className="text-xs font-sans-bold text-primary">{phone}</Text>
          </Pressable>
        ) : null}
      </View>

      <Text variant="muted" className="text-xs font-sans-bold uppercase tracking-wide mt-3 mb-4">
        {destinationLabel(order)}
      </Text>

      <View className="w-full gap-1.5">
        {order.items.map((it) => (
          <View key={it.id} className="flex-row items-center justify-center gap-2">
            <Text className="text-base font-sans-bold text-primary">{it.quantity}×</Text>
            <Text variant="muted" className="text-sm font-sans-semibold" numberOfLines={1}>
              {it.menuItem.name}
            </Text>
          </View>
        ))}
      </View>
    </MotiView>
  )
}

export default function KitchenBoard() {
  const router = useRouter()
  const { colors } = useTheme()
  const queryClient = useQueryClient()
  const [board, setBoard] = useState<
    { api: typeof ownerApi; rid: string | null; signOut: () => Promise<void> } | null
  >(null)
  const [unauth, setUnauth] = useState(false)
  const [mode, setMode] = useState<Mode>("KITCHEN")
  const [soundEnabled, setSoundEnabled] = useState(true)
  const seen = useRef<Set<string>>(new Set())
  const chime = useAudioPlayer(require("../../assets/new-order.wav"))
  const [, forceRerender] = useState(0)

  useEffect(() => {
    ;(async () => {
      const staff = await getStaffProfile()
      if (staff) {
        setBoard({ api: staffApi, rid: staff.restaurantId, signOut: staffSignOut })
        return
      }
      const ownerTok = await getOwnerToken()
      if (ownerTok) {
        const rests = await ownerApi
          .get<OwnerRestaurant[]>("/api/v1/restaurants")
          .catch(() => [] as OwnerRestaurant[])
        setBoard({ api: ownerApi, rid: rests?.[0]?.id ?? null, signOut: ownerSignOut })
        return
      }
      setUnauth(true)
    })()
  }, [])

  useEffect(() => {
    const id = setInterval(() => forceRerender((t) => t + 1), 30000)
    return () => clearInterval(id)
  }, [])

  const rid = board?.rid ?? null

  const { data: orders, isLoading } = useQuery({
    queryKey: ["kitchen-active", rid],
    queryFn: () => board!.api.get<ActiveOrder[]>(`/api/v1/restaurants/${rid}/orders/active`),
    enabled: !!rid,
    refetchInterval: 10000,
  })

  const playChime = useCallback(() => {
    try {
      chime.seekTo(0).catch(() => {})
      chime.play()
    } catch {}
  }, [chime])

  useEffect(() => {
    if (!orders) return
    const incoming = orders.filter((o) => o.status === "PLACED").map((o) => o.id)
    const fresh = incoming.some((id) => !seen.current.has(id))
    if (fresh && seen.current.size > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
      if (soundEnabled) playChime()
    }
    seen.current = new Set(orders.map((o) => o.id))
  }, [orders, soundEnabled, playChime])

  const advance = useMutation({
    mutationFn: ({ orderId, to }: { orderId: string; to: OrderStatus }) =>
      board!.api.patch(`/api/v1/restaurants/${rid}/orders/${orderId}/status`, { status: to }),
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      queryClient.invalidateQueries({ queryKey: ["kitchen-active", rid] })
    },
  })

  if (unauth) {
    return (
      <Screen>
        <View className="pt-1 pb-1">
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            className="w-10 h-10 rounded-full bg-surface border border-line items-center justify-center"
          >
            <ArrowLeft size={18} color={colors.ink} />
          </Pressable>
        </View>
        <View className="flex-1 justify-center">
          <Card>
            <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center mb-4">
              <ChefHat size={22} color={colors.primary} />
            </View>
            <Text variant="heading" className="text-2xl mb-2">
              Kitchen & counter
            </Text>
            <Text variant="muted" className="text-base leading-relaxed mb-6">
              Sign in with your staff account (kitchen or counter) to open the live board on this device.
            </Text>
            <Button title="Staff sign in" onPress={() => router.replace("/(kitchen)/login" as Href)} />
          </Card>
        </View>
      </Screen>
    )
  }

  if (!board || isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-canvas items-center justify-center">
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    )
  }

  const allOrders = orders ?? []
  const newOrders = allOrders.filter((o) => o.status === "PLACED")
  const cookingOrders = allOrders.filter((o) => o.status === "ACCEPTED" || o.status === "PREPARING")
  const readyOrders = allOrders.filter((o) => o.status === "READY")

  const sections: {
    key: string
    label: string
    icon: ReactNode
    tint: string
    orders: ActiveOrder[]
    empty: string
  }[] = [
    {
      key: "NEW",
      label: "New orders",
      icon: <Bell size={17} color={colors.primary} />,
      tint: "bg-primary/10",
      orders: newOrders,
      empty: "No new orders",
    },
    {
      key: "COOKING",
      label: "Cooking",
      icon: <Flame size={17} color={colors.warning} />,
      tint: "bg-warning/10",
      orders: cookingOrders,
      empty: "Nothing cooking yet",
    },
    {
      key: "READY",
      label: "Ready",
      icon: <CheckCircle2 size={17} color={colors.success} />,
      tint: "bg-success/10",
      orders: readyOrders,
      empty: "No orders ready yet",
    },
  ]

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <View className="flex-row items-center justify-between px-5 pb-4">
        <View className="flex-row bg-surface rounded-full border border-line p-1">
          {(["KITCHEN", "COUNTER"] as Mode[]).map((m) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              className={`flex-row items-center gap-2 px-5 py-2.5 rounded-full ${
                mode === m ? "bg-primary" : ""
              }`}
            >
              {m === "KITCHEN" ? (
                <ChefHat size={16} color={mode === m ? colors.onPrimary : colors.muted} />
              ) : (
                <HandPlatter size={16} color={mode === m ? colors.onPrimary : colors.muted} />
              )}
              <Text
                className="text-sm font-sans-bold"
                style={{ color: mode === m ? colors.onPrimary : colors.muted }}
              >
                {m === "KITCHEN" ? "Kitchen" : "Counter"}
              </Text>
            </Pressable>
          ))}
        </View>
        <View className="flex-row items-center gap-2">
          <SoundToggle enabled={soundEnabled} onToggle={() => setSoundEnabled((v) => !v)} />
          <ThemeToggle />
          <Pressable
            onPress={async () => {
              await board?.signOut()
              setBoard(null)
              setUnauth(true)
            }}
            className="w-11 h-11 rounded-full bg-surface border border-line items-center justify-center"
          >
            <LogOut size={18} color={colors.muted} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {mode === "KITCHEN" ? (
          <View className="gap-7">
            {sections.map((section) => (
              <View key={section.key}>
                <SectionHeader
                  icon={section.icon}
                  label={section.label}
                  count={section.orders.length}
                  tint={section.tint}
                />
                {section.orders.length === 0 ? (
                  <EmptySection label={section.empty} />
                ) : (
                  <View className="gap-3">
                    {section.orders.map((order, i) => {
                      const next = KITCHEN_NEXT[order.status] ?? null
                      return (
                        <KitchenTicketCard
                          key={order.id}
                          order={order}
                          index={i}
                          next={next}
                          isAdvancing={advance.isPending && advance.variables?.orderId === order.id}
                          onAdvance={() => next && advance.mutate({ orderId: order.id, to: next.to })}
                        />
                      )
                    })}
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : readyOrders.length === 0 ? (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            className="items-center py-28 gap-4"
          >
            <CheckCircle2 size={46} color={colors.muted} />
            <Text variant="title" className="text-xl">
              All clear!
            </Text>
            <Text variant="muted" className="text-base">
              No orders to give right now
            </Text>
          </MotiView>
        ) : (
          <View className="flex-row flex-wrap gap-3">
            {readyOrders.map((order, i) => (
              <CounterPickupCard key={order.id} order={order} index={i} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
