import { useEffect, useMemo, useRef, useState } from "react"
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
} from "react-native"
import { useRouter } from "expo-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { SafeAreaView } from "react-native-safe-area-context"
import { MotiView } from "moti"
import * as Haptics from "expo-haptics"
import {
  ArrowLeft,
  Lock,
  Banknote,
  CreditCard,
  ChevronDown,
  Store,
  UtensilsCrossed,
  Wallet,
  Palette,
  MapPin,
  Utensils,
  ShoppingBag,
  Bike,
  MessageSquare,
  Bell,
  Info,
} from "lucide-react-native"
import { SMS_NOTIFICATIONS } from "@orderkaro/shared"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { DeliveryMap } from "@/components/delivery-map"
import { ownerApi, OwnerApiError } from "@/lib/owner-api"
import { useOwnerRestaurant } from "@/lib/use-owner-restaurant"
import { useTheme } from "@/theme/theme-provider"
import type { OwnerRestaurant } from "@/lib/types"

interface OwnerRestaurantExtended extends OwnerRestaurant {
  acceptsCash?: boolean
  acceptsOnline?: boolean
  acceptsDineIn?: boolean
  acceptsTakeaway?: boolean
  acceptsDelivery?: boolean
}

type SectionKey = "profile" | "ordering" | "payments" | "notifications" | "branding" | "delivery"

const COLOR_PRESETS = ["#A31D33", "#BE2540", "#A9822B", "#1F6F54", "#2B4C7E", "#6B3FA0"]

const DEFAULT_MAP_LATITUDE = 20.5937
const DEFAULT_MAP_LONGITUDE = 78.9629
const RADIUS_MIN_KM = 0.5
const RADIUS_MAX_KM = 25
const RADIUS_STEP_KM = 0.5
const SLIDER_THUMB_SIZE = 26
const SLIDER_TRACK_HEIGHT = 44

function radiusFromTrackX(x: number, trackWidth: number) {
  const travel = trackWidth - SLIDER_THUMB_SIZE
  if (travel <= 0) return null
  const ratio = Math.min(1, Math.max(0, (x - SLIDER_THUMB_SIZE / 2) / travel))
  const raw = RADIUS_MIN_KM + ratio * (RADIUS_MAX_KM - RADIUS_MIN_KM)
  return Math.round(raw / RADIUS_STEP_KM) * RADIUS_STEP_KM
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
}: {
  label: string
  value: string
  onChangeText: (t: string) => void
  placeholder?: string
  keyboardType?: "default" | "number-pad" | "decimal-pad"
  autoCapitalize?: "none" | "sentences"
}) {
  const { colors } = useTheme()
  return (
    <View className="mb-3">
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
        className="h-14 rounded-2xl bg-canvas border border-line px-5 text-ink font-sans-medium text-base"
      />
    </View>
  )
}

function ToggleRow({
  icon: Icon,
  label,
  description,
  value,
  disabled,
  onValueChange,
  delay,
}: {
  icon: typeof Banknote
  label: string
  description: string
  value: boolean
  disabled: boolean
  onValueChange: (next: boolean) => void
  delay: number
}) {
  const { colors } = useTheme()
  return (
    <MotiView
      from={{ opacity: 0, translateX: -8 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: "timing", duration: 240, delay }}
      className="flex-row items-center justify-between gap-3 py-3.5"
    >
      <View className="flex-row items-center gap-3 flex-1 pr-3">
        <View className="w-10 h-10 rounded-xl bg-canvas items-center justify-center">
          <Icon size={17} color={colors.muted} />
        </View>
        <View className="flex-1">
          <Text variant="title" className="text-sm">
            {label}
          </Text>
          <Text variant="muted" className="text-xs">
            {description}
          </Text>
        </View>
      </View>
      <View className="items-end gap-1">
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: colors.line, true: colors.primary }}
          thumbColor="#FFF7F3"
        />
        {disabled ? (
          <Text variant="muted" className="text-[10px]">
            Must stay on
          </Text>
        ) : null}
      </View>
    </MotiView>
  )
}

function AccordionCard({
  title,
  icon: Icon,
  index,
  expanded,
  onToggle,
  children,
}: {
  title: string
  icon: typeof Banknote
  index: number
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  const { colors } = useTheme()
  const [contentHeight, setContentHeight] = useState(0)

  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 420, delay: 90 + index * 70 }}
      className="bg-surface rounded-3xl border border-line mb-4 overflow-hidden"
    >
      <Pressable
        onPress={() => {
          Haptics.selectionAsync()
          onToggle()
        }}
        className="flex-row items-center gap-3.5 p-5"
      >
        <MotiView
          animate={{ backgroundColor: expanded ? colors.primary : colors.canvas }}
          transition={{ type: "timing", duration: 300 }}
          className="w-11 h-11 rounded-2xl items-center justify-center"
        >
          <Icon size={18} color={expanded ? colors.onPrimary : colors.muted} />
        </MotiView>
        <Text variant="heading" className="text-lg flex-1">
          {title}
        </Text>
        <MotiView
          animate={{ rotate: expanded ? "180deg" : "0deg" }}
          transition={{ type: "timing", duration: 300 }}
        >
          <ChevronDown size={20} color={expanded ? colors.primary : colors.muted} />
        </MotiView>
      </Pressable>

      <MotiView
        animate={{ height: expanded ? contentHeight : 0 }}
        transition={{ type: "timing", duration: 360 }}
        style={{ overflow: "hidden" }}
      >
        <MotiView
          animate={{ opacity: expanded ? 1 : 0, translateY: expanded ? 0 : -8 }}
          transition={{ type: "timing", duration: 300, delay: expanded ? 90 : 0 }}
          onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}
          style={{ position: "absolute", left: 0, right: 0, top: 0 }}
        >
          <View className="px-5 pb-5">{children}</View>
        </MotiView>
      </MotiView>
    </MotiView>
  )
}

function RadiusSlider({ value, onChange }: { value: number; onChange: (km: number) => void }) {
  const { colors } = useTheme()
  const [trackWidth, setTrackWidth] = useState(0)
  const trackWidthRef = useRef(0)
  const changeRef = useRef(onChange)
  changeRef.current = onChange

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          Haptics.selectionAsync()
          const next = radiusFromTrackX(event.nativeEvent.locationX, trackWidthRef.current)
          if (next !== null) changeRef.current(next)
        },
        onPanResponderMove: (event) => {
          const next = radiusFromTrackX(event.nativeEvent.locationX, trackWidthRef.current)
          if (next !== null) changeRef.current(next)
        },
      }),
    []
  )

  const clamped = Math.min(RADIUS_MAX_KM, Math.max(RADIUS_MIN_KM, value))
  const ratio = (clamped - RADIUS_MIN_KM) / (RADIUS_MAX_KM - RADIUS_MIN_KM)
  const travel = Math.max(trackWidth - SLIDER_THUMB_SIZE, 0)
  const thumbOffset = ratio * travel
  const fillWidth = thumbOffset + SLIDER_THUMB_SIZE / 2

  return (
    <View>
      <View className="flex-row items-center justify-between mb-2.5">
        <Text variant="muted" className="text-xs uppercase tracking-widest">
          Delivery radius
        </Text>
        <View className="rounded-full bg-primary/10 px-3 py-1">
          <Text variant="label" className="text-sm" style={{ color: colors.primary }}>
            {clamped.toFixed(1)} km
          </Text>
        </View>
      </View>
      <View
        {...pan.panHandlers}
        onLayout={(event) => {
          const width = event.nativeEvent.layout.width
          trackWidthRef.current = width
          setTrackWidth(width)
        }}
        style={{ height: SLIDER_TRACK_HEIGHT }}
        className="justify-center"
      >
        <View pointerEvents="none" className="h-2 rounded-full bg-line overflow-hidden">
          <MotiView
            animate={{ width: fillWidth }}
            transition={{ type: "timing", duration: 90 }}
            style={{ backgroundColor: colors.primary }}
            className="h-2 rounded-full"
          />
        </View>
        <MotiView
          pointerEvents="none"
          animate={{ translateX: thumbOffset }}
          transition={{ type: "timing", duration: 90 }}
          style={{
            position: "absolute",
            left: 0,
            top: (SLIDER_TRACK_HEIGHT - SLIDER_THUMB_SIZE) / 2,
            width: SLIDER_THUMB_SIZE,
            height: SLIDER_THUMB_SIZE,
            borderColor: colors.primary,
            shadowColor: colors.primary,
            shadowOpacity: 0.25,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
          }}
          className="rounded-full bg-surface border-2 items-center justify-center"
        >
          <View style={{ backgroundColor: colors.primary }} className="w-2.5 h-2.5 rounded-full" />
        </MotiView>
      </View>
    </View>
  )
}

export default function OwnerSettings() {
  const router = useRouter()
  const { colors } = useTheme()
  const queryClient = useQueryClient()
  const { restaurant: rawRestaurant } = useOwnerRestaurant()
  const restaurant = rawRestaurant as OwnerRestaurantExtended | undefined
  const rid = restaurant?.id

  const [openSection, setOpenSection] = useState<SectionKey | null>(null)

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [openingTime, setOpeningTime] = useState("")
  const [closingTime, setClosingTime] = useState("")
  const [avgPrepTime, setAvgPrepTime] = useState("")

  const [primaryColor, setPrimaryColor] = useState("#A31D33")
  const [themeMode, setThemeMode] = useState<"LIGHT" | "DARK">("LIGHT")

  const [acceptsCash, setAcceptsCash] = useState(true)
  const [acceptsOnline, setAcceptsOnline] = useState(true)
  const [paymentMethodsError, setPaymentMethodsError] = useState("")

  const [acceptsDineIn, setAcceptsDineIn] = useState(true)
  const [acceptsTakeaway, setAcceptsTakeaway] = useState(true)
  const [acceptsDelivery, setAcceptsDelivery] = useState(true)
  const [orderingMethodsError, setOrderingMethodsError] = useState("")

  const [notifications, setNotifications] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SMS_NOTIFICATIONS.map((n) => [n.field, false]))
  )
  const [notificationsError, setNotificationsError] = useState("")

  const [deliveryEnabled, setDeliveryEnabled] = useState(false)
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [radius, setRadius] = useState("")
  const [fee, setFee] = useState("")
  const [minOrder, setMinOrder] = useState("")

  const [gate, setGate] = useState<{ branding?: string; delivery?: string }>({})

  useEffect(() => {
    if (!restaurant) return
    setName(restaurant.name ?? "")
    setSlug(restaurant.slug ?? "")
    setOpeningTime(restaurant.openingTime ?? "")
    setClosingTime(restaurant.closingTime ?? "")
    setAvgPrepTime(restaurant.avgPrepTime != null ? String(restaurant.avgPrepTime) : "")
    setPrimaryColor(restaurant.primaryColor ?? "#A31D33")
    setThemeMode(restaurant.themeMode ?? "LIGHT")
    setAcceptsCash(restaurant.acceptsCash ?? true)
    setAcceptsOnline(restaurant.acceptsOnline ?? true)
    setAcceptsDineIn(restaurant.acceptsDineIn ?? true)
    setAcceptsTakeaway(restaurant.acceptsTakeaway ?? true)
    setAcceptsDelivery(restaurant.acceptsDelivery ?? true)
    setNotifications(
      Object.fromEntries(SMS_NOTIFICATIONS.map((n) => [n.field, restaurant[n.field] ?? false]))
    )
    setDeliveryEnabled(!!restaurant.deliveryEnabled)
    setLatitude(restaurant.latitude != null ? String(restaurant.latitude) : "")
    setLongitude(restaurant.longitude != null ? String(restaurant.longitude) : "")
    setRadius(restaurant.deliveryRadiusKm != null ? String(restaurant.deliveryRadiusKm) : "")
    setFee(restaurant.deliveryFee != null ? String(Math.round(Number(restaurant.deliveryFee))) : "")
    setMinOrder(
      restaurant.minOrderValue != null ? String(Math.round(Number(restaurant.minOrderValue))) : ""
    )
  }, [restaurant])

  function toggleSection(key: SectionKey) {
    setOpenSection((prev) => (prev === key ? null : key))
  }

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["owner-restaurants"] })
  }
  function done() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    refresh()
  }

  const saveBasic = useMutation({
    mutationFn: () =>
      ownerApi.put(`/api/v1/restaurants/${rid}`, {
        name: name.trim(),
        slug: slug.trim(),
        openingTime,
        closingTime,
        avgPrepTime: Number(avgPrepTime) || 15,
      }),
    onSuccess: done,
  })

  const enabledPaymentMethodCount = Number(acceptsCash) + Number(acceptsOnline)
  const cashIsLastEnabled = acceptsCash && enabledPaymentMethodCount === 1
  const onlineIsLastEnabled = acceptsOnline && enabledPaymentMethodCount === 1

  function toggleAcceptsCash(next: boolean) {
    if (!next && enabledPaymentMethodCount === 1 && acceptsCash) return
    setAcceptsCash(next)
  }
  function toggleAcceptsOnline(next: boolean) {
    if (!next && enabledPaymentMethodCount === 1 && acceptsOnline) return
    setAcceptsOnline(next)
  }

  const savePaymentMethods = useMutation({
    mutationFn: () => ownerApi.put(`/api/v1/restaurants/${rid}`, { acceptsCash, acceptsOnline }),
    onSuccess: () => {
      setPaymentMethodsError("")
      done()
    },
    onError: (e) => setPaymentMethodsError((e as Error).message || "Could not save"),
  })

  const enabledOrderingMethodCount =
    Number(acceptsDineIn) + Number(acceptsTakeaway) + Number(acceptsDelivery)
  const dineInIsLastEnabled = acceptsDineIn && enabledOrderingMethodCount === 1
  const takeawayIsLastEnabled = acceptsTakeaway && enabledOrderingMethodCount === 1
  const deliveryMethodIsLastEnabled = acceptsDelivery && enabledOrderingMethodCount === 1

  function toggleAcceptsDineIn(next: boolean) {
    if (!next && enabledOrderingMethodCount === 1 && acceptsDineIn) return
    setAcceptsDineIn(next)
  }
  function toggleAcceptsTakeaway(next: boolean) {
    if (!next && enabledOrderingMethodCount === 1 && acceptsTakeaway) return
    setAcceptsTakeaway(next)
  }
  function toggleAcceptsDelivery(next: boolean) {
    if (!next && enabledOrderingMethodCount === 1 && acceptsDelivery) return
    setAcceptsDelivery(next)
  }

  const saveOrderingMethods = useMutation({
    mutationFn: () =>
      ownerApi.put(`/api/v1/restaurants/${rid}`, {
        acceptsDineIn,
        acceptsTakeaway,
        acceptsDelivery,
      }),
    onSuccess: () => {
      setOrderingMethodsError("")
      done()
    },
    onError: (e) => setOrderingMethodsError((e as Error).message || "Could not save"),
  })

  function toggleNotification(field: string) {
    setNotifications((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const saveNotifications = useMutation({
    mutationFn: () => ownerApi.put(`/api/v1/restaurants/${rid}`, notifications),
    onSuccess: () => {
      setNotificationsError("")
      done()
    },
    onError: (e) => setNotificationsError((e as Error).message || "Could not save"),
  })

  const saveBrand = useMutation({
    mutationFn: () =>
      ownerApi.put(`/api/v1/restaurants/${rid}/branding`, { primaryColor, themeMode }),
    onSuccess: () => {
      setGate((g) => ({ ...g, branding: undefined }))
      done()
    },
    onError: (e) =>
      setGate((g) => ({
        ...g,
        branding:
          (e as OwnerApiError)?.status === 402
            ? (e as Error).message
            : (e as Error).message || "Could not save",
      })),
  })

  const saveDelivery = useMutation({
    mutationFn: () =>
      ownerApi.put(`/api/v1/restaurants/${rid}/delivery-zone`, {
        deliveryEnabled,
        latitude: latitude.trim() ? Number(latitude) : null,
        longitude: longitude.trim() ? Number(longitude) : null,
        deliveryRadiusKm: Number(radius) || 1,
        deliveryFee: Number(fee) || 0,
        minOrderValue: Number(minOrder) || 0,
      }),
    onSuccess: () => {
      setGate((g) => ({ ...g, delivery: undefined }))
      done()
    },
    onError: (e) =>
      setGate((g) => ({
        ...g,
        delivery:
          (e as OwnerApiError)?.status === 402
            ? (e as Error).message
            : (e as Error).message || "Could not save",
      })),
  })

  const mapLatitude =
    latitude.trim() && Number.isFinite(Number(latitude)) ? Number(latitude) : DEFAULT_MAP_LATITUDE
  const mapLongitude =
    longitude.trim() && Number.isFinite(Number(longitude))
      ? Number(longitude)
      : DEFAULT_MAP_LONGITUDE
  const mapRadiusKm = Number(radius) || 3

  function handleMapChange(nextLatitude: number, nextLongitude: number) {
    setLatitude(nextLatitude.toFixed(6))
    setLongitude(nextLongitude.toFixed(6))
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-row items-center gap-3 px-5 pb-3">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-surface border border-line items-center justify-center"
          >
            <ArrowLeft size={18} color={colors.ink} />
          </Pressable>
          <Text variant="heading" className="text-2xl">
            Settings
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingTop: 6, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <AccordionCard
            title="Restaurant profile"
            icon={Store}
            index={0}
            expanded={openSection === "profile"}
            onToggle={() => toggleSection("profile")}
          >
            <Field label="Name" value={name} onChangeText={setName} autoCapitalize="sentences" />
            <Field label="URL slug" value={slug} onChangeText={setSlug} autoCapitalize="none" />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Field label="Opens" value={openingTime} onChangeText={setOpeningTime} placeholder="09:00" />
              </View>
              <View className="flex-1">
                <Field label="Closes" value={closingTime} onChangeText={setClosingTime} placeholder="22:00" />
              </View>
            </View>
            <Field
              label="Avg prep (min)"
              value={avgPrepTime}
              onChangeText={(t) => setAvgPrepTime(t.replace(/[^\d]/g, ""))}
              keyboardType="number-pad"
            />
            <View className="mt-2">
              <Button title="Save profile" loading={saveBasic.isPending} onPress={() => saveBasic.mutate()} />
            </View>
          </AccordionCard>

          <AccordionCard
            title="Ordering methods"
            icon={UtensilsCrossed}
            index={1}
            expanded={openSection === "ordering"}
            onToggle={() => toggleSection("ordering")}
          >
            <View>
              <ToggleRow
                icon={Utensils}
                label="Dine-in"
                description="Guests order to a table from the QR at their seat"
                value={acceptsDineIn}
                disabled={dineInIsLastEnabled}
                onValueChange={toggleAcceptsDineIn}
                delay={0}
              />
              <View className="h-px bg-line" />
              <ToggleRow
                icon={ShoppingBag}
                label="Takeaway"
                description="Guests collect their order at the counter"
                value={acceptsTakeaway}
                disabled={takeawayIsLastEnabled}
                onValueChange={toggleAcceptsTakeaway}
                delay={60}
              />
              <View className="h-px bg-line" />
              <ToggleRow
                icon={Bike}
                label="Delivery"
                description="Riders bring orders to the guest's location"
                value={acceptsDelivery}
                disabled={deliveryMethodIsLastEnabled}
                onValueChange={toggleAcceptsDelivery}
                delay={120}
              />
            </View>

            {orderingMethodsError ? (
              <Text className="text-danger font-sans-medium text-sm mt-3">
                {orderingMethodsError}
              </Text>
            ) : null}

            <View className="mt-4">
              <Button
                title="Save ordering methods"
                loading={saveOrderingMethods.isPending}
                onPress={() => saveOrderingMethods.mutate()}
              />
            </View>
          </AccordionCard>

          <AccordionCard
            title="Payment methods"
            icon={Wallet}
            index={2}
            expanded={openSection === "payments"}
            onToggle={() => toggleSection("payments")}
          >
            <View>
              <ToggleRow
                icon={Banknote}
                label="Cash"
                description="Paid in person, collected by your counter staff"
                value={acceptsCash}
                disabled={cashIsLastEnabled}
                onValueChange={toggleAcceptsCash}
                delay={0}
              />
              <View className="h-px bg-line" />
              <ToggleRow
                icon={CreditCard}
                label="Online"
                description="Card, UPI and net banking through your payment gateway"
                value={acceptsOnline}
                disabled={onlineIsLastEnabled}
                onValueChange={toggleAcceptsOnline}
                delay={60}
              />
            </View>

            {paymentMethodsError ? (
              <Text className="text-danger font-sans-medium text-sm mt-3">
                {paymentMethodsError}
              </Text>
            ) : null}

            <View className="mt-4">
              <Button
                title="Save payment methods"
                loading={savePaymentMethods.isPending}
                onPress={() => savePaymentMethods.mutate()}
              />
            </View>
          </AccordionCard>

          <AccordionCard
            title="Order notifications"
            icon={MessageSquare}
            index={3}
            expanded={openSection === "notifications"}
            onToggle={() => toggleSection("notifications")}
          >
            {restaurant && !restaurant.smsEnabled ? (
              <View className="flex-row items-start gap-2 bg-canvas border border-line rounded-2xl p-3 mb-4">
                <Info size={15} color={colors.accent} style={{ marginTop: 2 }} />
                <Text variant="muted" className="text-xs flex-1">
                  SMS isn't switched on for your restaurant yet. Set your preferences here — they take
                  effect as soon as it's enabled.
                </Text>
              </View>
            ) : null}

            <View>
              {SMS_NOTIFICATIONS.map((n, i) => (
                <View key={n.field}>
                  {i > 0 ? <View className="h-px bg-line" /> : null}
                  <ToggleRow
                    icon={n.audience === "OWNER" ? Bell : MessageSquare}
                    label={n.label}
                    description={n.description}
                    value={!!notifications[n.field]}
                    disabled={false}
                    onValueChange={() => toggleNotification(n.field)}
                    delay={i * 60}
                  />
                </View>
              ))}
            </View>

            {notificationsError ? (
              <Text className="text-danger font-sans-medium text-sm mt-3">
                {notificationsError}
              </Text>
            ) : null}

            <View className="mt-4">
              <Button
                title="Save notifications"
                loading={saveNotifications.isPending}
                onPress={() => saveNotifications.mutate()}
              />
            </View>
          </AccordionCard>

          <AccordionCard
            title="Branding"
            icon={Palette}
            index={4}
            expanded={openSection === "branding"}
            onToggle={() => toggleSection("branding")}
          >
            <Text variant="muted" className="text-xs uppercase tracking-widest mb-2">
              Primary color
            </Text>
            <View className="flex-row flex-wrap gap-3 mb-3">
              {COLOR_PRESETS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setPrimaryColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-11 h-11 rounded-full ${
                    primaryColor.toLowerCase() === c.toLowerCase() ? "border-2 border-ink" : ""
                  }`}
                />
              ))}
            </View>
            <Field label="Hex" value={primaryColor} onChangeText={setPrimaryColor} autoCapitalize="none" />

            <Text variant="muted" className="text-xs uppercase tracking-widest mb-1.5 mt-1">
              Storefront theme
            </Text>
            <View className="flex-row gap-2 mb-3">
              {(["LIGHT", "DARK"] as const).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setThemeMode(m)}
                  className={`flex-1 h-12 rounded-2xl items-center justify-center border ${
                    themeMode === m ? "bg-primary border-primary" : "bg-canvas border-line"
                  }`}
                >
                  <Text
                    variant="label"
                    className="text-sm"
                    style={{ color: themeMode === m ? colors.onPrimary : colors.ink }}
                  >
                    {m}
                  </Text>
                </Pressable>
              ))}
            </View>

            {gate.branding ? (
              <View className="flex-row items-center gap-2 bg-canvas border border-line rounded-2xl p-3 mb-3">
                <Lock size={15} color={colors.accent} />
                <Text variant="muted" className="text-sm flex-1">
                  {gate.branding} Manage your plan from the Vision Menu web dashboard.
                </Text>
              </View>
            ) : null}

            <Button title="Save branding" loading={saveBrand.isPending} onPress={() => saveBrand.mutate()} />
          </AccordionCard>

          <AccordionCard
            title="Delivery zone"
            icon={MapPin}
            index={5}
            expanded={openSection === "delivery"}
            onToggle={() => toggleSection("delivery")}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text variant="body" className="text-base">
                Enable delivery
              </Text>
              <Switch
                value={deliveryEnabled}
                onValueChange={setDeliveryEnabled}
                trackColor={{ false: colors.line, true: colors.primary }}
                thumbColor="#FFF7F3"
              />
            </View>

            {deliveryEnabled ? (
              <View className="mb-4">
                <DeliveryMap
                  latitude={mapLatitude}
                  longitude={mapLongitude}
                  radiusKm={mapRadiusKm}
                  onChange={handleMapChange}
                />
                <View className="mt-4">
                  <RadiusSlider value={mapRadiusKm} onChange={(km) => setRadius(String(km))} />
                </View>
                <Text variant="muted" className="text-xs mt-3">
                  Tap the map or drag the pin to place your restaurant, then slide to size the
                  delivery zone.
                </Text>
              </View>
            ) : null}

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Field
                  label="Latitude"
                  value={latitude}
                  onChangeText={(t) => setLatitude(t.replace(/[^\d.\-]/g, ""))}
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="flex-1">
                <Field
                  label="Longitude"
                  value={longitude}
                  onChangeText={(t) => setLongitude(t.replace(/[^\d.\-]/g, ""))}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Field
                  label="Delivery fee (₹)"
                  value={fee}
                  onChangeText={(t) => setFee(t.replace(/[^\d]/g, ""))}
                  keyboardType="number-pad"
                />
              </View>
              <View className="flex-1">
                <Field
                  label="Min order (₹)"
                  value={minOrder}
                  onChangeText={(t) => setMinOrder(t.replace(/[^\d]/g, ""))}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {gate.delivery ? (
              <View className="flex-row items-center gap-2 bg-canvas border border-line rounded-2xl p-3 mb-3">
                <Lock size={15} color={colors.accent} />
                <Text variant="muted" className="text-sm flex-1">
                  {gate.delivery} Manage your plan from the Vision Menu web dashboard.
                </Text>
              </View>
            ) : null}

            <View className="mt-1">
              <Button title="Save delivery zone" loading={saveDelivery.isPending} onPress={() => saveDelivery.mutate()} />
            </View>
            <Text variant="muted" className="text-xs mt-3">
              Tip: fine-tune the exact latitude and longitude for precise distance-based delivery.
            </Text>
          </AccordionCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
