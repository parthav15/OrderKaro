"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Settings,
  Clock,
  Store,
  CheckCircle2,
  Link2,
  Copy,
  Palette,
  MapPin,
  Navigation,
  ToggleLeft,
  ToggleRight,
  ArrowUpCircle,
  Wallet,
  Banknote,
  CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ToggleSwitch } from "@/components/admin/fee-config-card"
import api from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { BRAND_COLOR_PRESETS, DEFAULT_BRAND_COLOR, readableTextColor } from "@/lib/brand-color"
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe"

interface PaymentMethodsFormState {
  acceptsWallet: boolean
  acceptsCash: boolean
  acceptsOnline: boolean
}

const PAYMENT_METHOD_FIELDS: {
  key: keyof PaymentMethodsFormState
  label: string
  description: string
  icon: typeof Wallet
}[] = [
  {
    key: "acceptsWallet",
    label: "Wallet",
    description: "Prepaid balance customers top up and spend at your restaurant",
    icon: Wallet,
  },
  {
    key: "acceptsCash",
    label: "Cash",
    description: "Paid in person, collected by your counter staff",
    icon: Banknote,
  },
  {
    key: "acceptsOnline",
    label: "Online",
    description: "Card, UPI and net banking through your payment gateway",
    icon: CreditCard,
  },
]

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/

function resolveMenuBase() {
  const configured = process.env.NEXT_PUBLIC_APP_URL
  if (configured) return configured.replace(/\/$/, "")
  if (typeof window !== "undefined") return window.location.origin
  return ""
}

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [restaurantId, setRestaurantId] = useState<string>("")
  const [form, setForm] = useState({
    name: "",
    slug: "",
    openingTime: "08:00",
    closingTime: "22:00",
    avgPrepTime: 15,
  })

  const { data: restaurants } = useQuery({
    queryKey: ["restaurants"],
    queryFn: () => api.get("/api/v1/restaurants").then((r) => r.data.data),
  })

  useEffect(() => {
    if (restaurants?.[0] && !restaurantId) {
      setRestaurantId(restaurants[0].id)
    }
  }, [restaurants, restaurantId])

  const restaurant = restaurants?.find((c: any) => c.id === restaurantId)

  useEffect(() => {
    if (restaurant) {
      setForm({
        name: restaurant.name || "",
        slug: restaurant.slug || "",
        openingTime: restaurant.openingTime || "08:00",
        closingTime: restaurant.closingTime || "22:00",
        avgPrepTime: restaurant.avgPrepTime || 15,
      })
    }
  }, [restaurant])

  const update = useMutation({
    mutationFn: (data: any) => api.put(`/api/v1/restaurants/${restaurantId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurants"] })
      toast.success("Settings saved successfully")
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to save"),
  })

  const [brandForm, setBrandForm] = useState({
    primaryColor: DEFAULT_BRAND_COLOR,
    themeMode: "LIGHT" as "LIGHT" | "DARK",
  })

  useEffect(() => {
    if (restaurant) {
      setBrandForm({
        primaryColor: restaurant.primaryColor || DEFAULT_BRAND_COLOR,
        themeMode: restaurant.themeMode === "DARK" ? "DARK" : "LIGHT",
      })
    }
  }, [restaurant])

  const isValidBrandColor = HEX_COLOR_PATTERN.test(brandForm.primaryColor)

  const updateBranding = useMutation({
    mutationFn: (data: any) => api.put(`/api/v1/restaurants/${restaurantId}/branding`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurants"] })
      toast.success("Branding saved successfully")
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to save branding"),
  })

  const brandingUpgradeRequired = (updateBranding.error as any)?.response?.status === 402

  const [deliveryForm, setDeliveryForm] = useState({
    deliveryEnabled: false,
    latitude: "",
    longitude: "",
    deliveryRadiusKm: "3",
    deliveryFee: "0",
    minOrderValue: "0",
  })

  useEffect(() => {
    if (restaurant) {
      setDeliveryForm({
        deliveryEnabled: !!restaurant.deliveryEnabled,
        latitude: restaurant.latitude != null ? String(restaurant.latitude) : "",
        longitude: restaurant.longitude != null ? String(restaurant.longitude) : "",
        deliveryRadiusKm:
          restaurant.deliveryRadiusKm != null ? String(restaurant.deliveryRadiusKm) : "3",
        deliveryFee: restaurant.deliveryFee != null ? String(Number(restaurant.deliveryFee)) : "0",
        minOrderValue:
          restaurant.minOrderValue != null ? String(Number(restaurant.minOrderValue)) : "0",
      })
    }
  }, [restaurant])

  const updateDeliveryZone = useMutation({
    mutationFn: (data: any) => api.put(`/api/v1/restaurants/${restaurantId}/delivery-zone`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurants"] })
      toast.success("Delivery zone saved successfully")
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to save delivery zone"),
  })

  const deliveryUpgradeRequired = (updateDeliveryZone.error as any)?.response?.status === 402

  const reduceMotion = useReducedMotionSafe()

  const [paymentMethodsForm, setPaymentMethodsForm] = useState<PaymentMethodsFormState>({
    acceptsWallet: true,
    acceptsCash: true,
    acceptsOnline: true,
  })

  useEffect(() => {
    if (restaurant) {
      setPaymentMethodsForm({
        acceptsWallet: restaurant.acceptsWallet ?? true,
        acceptsCash: restaurant.acceptsCash ?? true,
        acceptsOnline: restaurant.acceptsOnline ?? true,
      })
    }
  }, [restaurant])

  const enabledPaymentMethodCount =
    Number(paymentMethodsForm.acceptsWallet) +
    Number(paymentMethodsForm.acceptsCash) +
    Number(paymentMethodsForm.acceptsOnline)

  function isLastEnabledPaymentMethod(key: keyof PaymentMethodsFormState) {
    return paymentMethodsForm[key] && enabledPaymentMethodCount === 1
  }

  function togglePaymentMethod(key: keyof PaymentMethodsFormState) {
    setPaymentMethodsForm((prev) => {
      const count = Number(prev.acceptsWallet) + Number(prev.acceptsCash) + Number(prev.acceptsOnline)
      if (prev[key] && count === 1) return prev
      return { ...prev, [key]: !prev[key] }
    })
  }

  const updatePaymentMethods = useMutation({
    mutationFn: (data: PaymentMethodsFormState) => api.put(`/api/v1/restaurants/${restaurantId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurants"] })
      toast.success("Payment methods saved successfully")
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to save payment methods"),
  })

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDeliveryForm((prev) => ({
          ...prev,
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
        }))
        toast.success("Location captured")
      },
      (error) => {
        toast.error(error.message || "Unable to access your location")
      }
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-brand-red" />
            </div>
            <h1 className="text-3xl font-extrabold text-ink">Settings</h1>
          </div>
          <p className="text-muted">Update your restaurant's basic information and hours</p>
        </div>
        {restaurants && restaurants.length > 1 && (
          <select
            value={restaurantId}
            onChange={(e) => setRestaurantId(e.target.value)}
            className="px-4 py-3 rounded-xl border border-line text-sm focus:outline-none focus:border-brand-red"
          >
            {restaurants.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          update.mutate({
            name: form.name,
            slug: form.slug,
            openingTime: form.openingTime,
            closingTime: form.closingTime,
            avgPrepTime: Number(form.avgPrepTime),
          })
        }}
        className="space-y-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-elevated flex items-center justify-center">
                  <Store className="w-5 h-5 text-muted" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink">Restaurant Name</h2>
                  <p className="text-sm text-muted">The name shown to customers on the menu page</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Main Campus Cafeteria"
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-muted transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-elevated flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-muted" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink">Menu URL Slug</h2>
                  <p className="text-sm text-muted">The URL path customers use to access your menu</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                value={form.slug}
                onChange={(e) =>
                  setForm({
                    ...form,
                    slug: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "-")
                      .replace(/-+/g, "-")
                      .replace(/^-/, ""),
                  })
                }
                placeholder="e.g. campus-cafe"
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-muted transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
              />
              {form.slug && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 p-3 bg-surface-elevated rounded-xl"
                >
                  <Link2 className="w-4 h-4 text-muted shrink-0" />
                  <p className="text-sm text-muted truncate flex-1">
                    {resolveMenuBase().replace(/^https?:\/\//, "")}/<strong>{form.slug}</strong>/menu
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${resolveMenuBase()}/${form.slug}/menu`)
                      toast.success("URL copied!")
                    }}
                    className="p-1.5 rounded-lg hover:bg-line transition-colors shrink-0"
                  >
                    <Copy className="w-4 h-4 text-muted" />
                  </button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-elevated flex items-center justify-center">
                  <Clock className="w-5 h-5 text-muted" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink">Operating Hours</h2>
                  <p className="text-sm text-muted">When your restaurant accepts orders</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-ink">Opens At</label>
                  <input
                    type="time"
                    value={form.openingTime}
                    onChange={(e) => setForm({ ...form, openingTime: e.target.value })}
                    className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-ink">Closes At</label>
                  <input
                    type="time"
                    value={form.closingTime}
                    onChange={(e) => setForm({ ...form, closingTime: e.target.value })}
                    className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                  />
                </div>
              </div>

              {form.openingTime && form.closingTime && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 p-3 bg-surface-elevated rounded-xl"
                >
                  <Clock className="w-4 h-4 text-muted" />
                  <p className="text-sm text-muted">
                    Open from <strong>{form.openingTime}</strong> to <strong>{form.closingTime}</strong>
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-elevated flex items-center justify-center">
                  <Clock className="w-5 h-5 text-muted" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink">Average Preparation Time</h2>
                  <p className="text-sm text-muted">Shown to customers as expected wait time</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={String(form.avgPrepTime)}
                  onChange={(e) => setForm({ ...form, avgPrepTime: Number(e.target.value) })}
                  className="w-32 rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                />
                <span className="text-base font-semibold text-muted">minutes</span>
              </div>
              <p className="text-sm text-muted">
                Customers see: "Ready in approximately {form.avgPrepTime} minutes"
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button type="submit" size="lg" className="w-full" loading={update.isPending}>
            <CheckCircle2 className="w-5 h-5" /> Save All Settings
          </Button>
        </motion.div>
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          updatePaymentMethods.mutate(paymentMethodsForm)
        }}
        className="mt-6"
      >
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.3, delay: reduceMotion ? 0 : 0.22 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-elevated flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-muted" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink">Payment Methods</h2>
                  <p className="text-sm text-muted">Choose how customers can pay at checkout</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="divide-y divide-line">
                {PAYMENT_METHOD_FIELDS.map((field, idx) => {
                  const Icon = field.icon
                  const isLast = isLastEnabledPaymentMethod(field.key)
                  return (
                    <motion.div
                      key={field.key}
                      initial={{ opacity: 0, x: reduceMotion ? 0 : -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: reduceMotion ? 0.01 : 0.25,
                        delay: reduceMotion ? 0 : 0.05 * idx,
                      }}
                      className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-surface-elevated flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-muted" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-ink">{field.label}</p>
                          <p className="text-xs text-muted">{field.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <ToggleSwitch
                          checked={paymentMethodsForm[field.key]}
                          onChange={() => togglePaymentMethod(field.key)}
                          ariaLabel={`Toggle ${field.label} payments`}
                          disabled={isLast}
                        />
                        <AnimatePresence>
                          {isLast && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
                              className="max-w-[8.5rem] overflow-hidden text-right text-[11px] leading-tight text-muted"
                            >
                              At least one must stay on
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              <Button type="submit" className="w-full" loading={updatePaymentMethods.isPending}>
                <CheckCircle2 className="w-5 h-5" /> Save Payment Methods
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!isValidBrandColor) return
          updateBranding.mutate({
            primaryColor: brandForm.primaryColor,
            themeMode: brandForm.themeMode,
          })
        }}
        className="mt-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-elevated flex items-center justify-center">
                  <Palette className="w-5 h-5 text-muted" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink">Brand</h2>
                  <p className="text-sm text-muted">Customize the colour and theme shown to customers</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-bold text-ink">Primary Colour</label>
                <div className="flex flex-wrap gap-3">
                  {BRAND_COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setBrandForm({ ...brandForm, primaryColor: color })}
                      aria-label={color}
                      className={cn(
                        "w-9 h-9 rounded-full border-2 transition-transform",
                        brandForm.primaryColor.toLowerCase() === color.toLowerCase()
                          ? "border-ink scale-110"
                          : "border-line hover:scale-105"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <input
                    value={brandForm.primaryColor}
                    onChange={(e) => setBrandForm({ ...brandForm, primaryColor: e.target.value })}
                    placeholder="#DC2626"
                    className="w-40 rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-muted transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                  />
                  <div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl"
                    style={{
                      backgroundColor: isValidBrandColor ? brandForm.primaryColor : DEFAULT_BRAND_COLOR,
                      color: readableTextColor(isValidBrandColor ? brandForm.primaryColor : DEFAULT_BRAND_COLOR),
                    }}
                  >
                    <Palette className="w-4 h-4" />
                    <span className="text-sm font-semibold">Preview</span>
                  </div>
                </div>
                {!isValidBrandColor && (
                  <p className="text-sm text-brand-red">Enter a valid hex colour, e.g. #DC2626</p>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-ink">Theme Mode</label>
                <div className="inline-flex rounded-xl border border-line p-1">
                  {(["LIGHT", "DARK"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setBrandForm({ ...brandForm, themeMode: mode })}
                      className={cn(
                        "px-5 py-2 rounded-lg text-sm font-semibold transition-colors",
                        brandForm.themeMode === mode
                          ? "bg-ink text-canvas"
                          : "text-muted hover:text-ink"
                      )}
                    >
                      {mode === "LIGHT" ? "Light" : "Dark"}
                    </button>
                  ))}
                </div>
              </div>

              {brandingUpgradeRequired && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 p-3 bg-surface-elevated rounded-xl"
                >
                  <ArrowUpCircle className="w-4 h-4 text-brand-red shrink-0" />
                  <p className="text-sm text-muted">
                    Upgrade required to customize branding.{" "}
                    <Link href="/owner/billing" className="text-brand-red font-semibold hover:underline">
                      View plans
                    </Link>
                  </p>
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full"
                loading={updateBranding.isPending}
                disabled={!isValidBrandColor}
              >
                <CheckCircle2 className="w-5 h-5" /> Save Brand
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          updateDeliveryZone.mutate({
            deliveryEnabled: deliveryForm.deliveryEnabled,
            latitude: Number(deliveryForm.latitude),
            longitude: Number(deliveryForm.longitude),
            deliveryRadiusKm: Number(deliveryForm.deliveryRadiusKm),
            deliveryFee: Number(deliveryForm.deliveryFee),
            minOrderValue: Number(deliveryForm.minOrderValue),
          })
        }}
        className="mt-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-elevated flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-muted" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink">Delivery Zone</h2>
                  <p className="text-sm text-muted">Set where and how you deliver orders</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <button
                type="button"
                onClick={() =>
                  setDeliveryForm({ ...deliveryForm, deliveryEnabled: !deliveryForm.deliveryEnabled })
                }
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-elevated transition-colors text-sm font-semibold text-muted"
              >
                {deliveryForm.deliveryEnabled ? (
                  <ToggleRight className="w-6 h-6 text-ink" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-muted" />
                )}
                Delivery {deliveryForm.deliveryEnabled ? "Enabled" : "Disabled"}
              </button>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-ink">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={deliveryForm.latitude}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, latitude: e.target.value })}
                    className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-ink">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={deliveryForm.longitude}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, longitude: e.target.value })}
                    className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={useCurrentLocation}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line text-sm font-semibold text-ink hover:bg-surface-elevated transition-colors"
              >
                <Navigation className="w-4 h-4" /> Use my current location
              </button>

              <div className="grid grid-cols-3 gap-5">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-ink">Radius (km)</label>
                  <input
                    type="number"
                    min="0.1"
                    max="50"
                    step="0.1"
                    value={deliveryForm.deliveryRadiusKm}
                    onChange={(e) =>
                      setDeliveryForm({ ...deliveryForm, deliveryRadiusKm: e.target.value })
                    }
                    className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-ink">Delivery Fee</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={deliveryForm.deliveryFee}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryFee: e.target.value })}
                    className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-ink">Min Order Value</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={deliveryForm.minOrderValue}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, minOrderValue: e.target.value })}
                    className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                  />
                </div>
              </div>

              {deliveryUpgradeRequired && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 p-3 bg-surface-elevated rounded-xl"
                >
                  <ArrowUpCircle className="w-4 h-4 text-brand-red shrink-0" />
                  <p className="text-sm text-muted">
                    Upgrade required to set up a delivery zone.{" "}
                    <Link href="/owner/billing" className="text-brand-red font-semibold hover:underline">
                      View plans
                    </Link>
                  </p>
                </motion.div>
              )}

              <Button type="submit" className="w-full" loading={updateDeliveryZone.isPending}>
                <CheckCircle2 className="w-5 h-5" /> Save Delivery Zone
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </form>
    </div>
  )
}
