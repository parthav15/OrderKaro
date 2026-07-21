import { useState } from "react"
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { useRouter } from "expo-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { SafeAreaView } from "react-native-safe-area-context"
import * as Haptics from "expo-haptics"
import { ArrowLeft, ShieldCheck, RefreshCw } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { ownerApi } from "@/lib/owner-api"
import { useOwnerRestaurant } from "@/lib/use-owner-restaurant"
import { useTheme } from "@/theme/theme-provider"

interface PaymentAccount {
  provider: "PAYPUR" | "STRIPE"
  country: string
  currency: string
  connected: boolean
  status: string
  paypurKeyPreview?: string | null
  stripeKeyPreview?: string | null
  commissionPercent?: number
}

export default function OwnerPayments() {
  const router = useRouter()
  const { colors } = useTheme()
  const queryClient = useQueryClient()
  const { restaurant } = useOwnerRestaurant()
  const rid = restaurant?.id

  const [editing, setEditing] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [signingSecret, setSigningSecret] = useState("")
  const [secretKey, setSecretKey] = useState("")
  const [error, setError] = useState("")
  const [reconcileMsg, setReconcileMsg] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["owner-payment-account", rid],
    queryFn: () => ownerApi.get<PaymentAccount>(`/api/v1/restaurants/${rid}/payment-account`),
    enabled: !!rid,
  })

  const isStripe = data?.provider === "STRIPE"
  const preview = isStripe ? data?.stripeKeyPreview : data?.paypurKeyPreview

  function resetForm() {
    setApiKey("")
    setSigningSecret("")
    setSecretKey("")
    setError("")
  }

  const connect = useMutation({
    mutationFn: () =>
      ownerApi.put(`/api/v1/restaurants/${rid}/payment-account`, isStripe
        ? { secretKey: secretKey.trim() }
        : { apiKey: apiKey.trim(), signingSecret: signingSecret.trim() }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      queryClient.invalidateQueries({ queryKey: ["owner-payment-account", rid] })
      setEditing(false)
      resetForm()
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not save credentials"),
  })

  const disconnect = useMutation({
    mutationFn: () => ownerApi.delete(`/api/v1/restaurants/${rid}/payment-account`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-payment-account", rid] }),
  })

  const reconcile = useMutation({
    mutationFn: () =>
      ownerApi.post<{ checked: number; confirmed: number }>(
        `/api/v1/restaurants/${rid}/payments/reconcile`
      ),
    onSuccess: (r) =>
      setReconcileMsg(`Checked ${r.checked} pending · confirmed ${r.confirmed} paid`),
  })

  const canSave = isStripe ? secretKey.trim().length > 0 : apiKey.trim() && signingSecret.trim()

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
            Payments
          </Text>
        </View>

        {isLoading || !data ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 6, paddingBottom: 40 }}>
            <View className="bg-surface rounded-3xl border border-line p-5 mb-5">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <ShieldCheck size={18} color={colors.accent} />
                  <Text variant="heading" className="text-xl">
                    {isStripe ? "Stripe" : "PayPur"}
                  </Text>
                </View>
                <View
                  className={`rounded-full px-3 py-1 ${
                    data.connected ? "bg-success/15" : "bg-canvas border border-line"
                  }`}
                >
                  <Text
                    variant="label"
                    className={`text-xs ${data.connected ? "text-success" : "text-muted"}`}
                  >
                    {data.connected ? data.status || "Active" : "Not connected"}
                  </Text>
                </View>
              </View>
              <Text variant="muted" className="text-sm">
                Diners in {data.country} pay you directly in {data.currency}. We never hold your
                money — no per-order commission.
              </Text>
              {data.connected && preview ? (
                <View className="mt-4 bg-canvas rounded-2xl border border-line px-4 py-3">
                  <Text variant="muted" className="text-xs mb-0.5">
                    Connected key
                  </Text>
                  <Text variant="body" className="text-base">
                    {preview}
                  </Text>
                </View>
              ) : null}
            </View>

            {editing || !data.connected ? (
              <View className="bg-surface rounded-3xl border border-line p-5 mb-4">
                <Text variant="title" className="text-base mb-4">
                  {data.connected ? "Replace credentials" : `Connect ${isStripe ? "Stripe" : "PayPur"}`}
                </Text>

                {isStripe ? (
                  <TextInput
                    value={secretKey}
                    onChangeText={setSecretKey}
                    placeholder="Secret key (sk_live_… or rk_live_…)"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="none"
                    secureTextEntry
                    className="h-14 rounded-2xl bg-canvas border border-line px-5 text-ink font-sans-medium text-base mb-3"
                  />
                ) : (
                  <>
                    <TextInput
                      value={apiKey}
                      onChangeText={setApiKey}
                      placeholder="PayPur API key"
                      placeholderTextColor={colors.muted}
                      autoCapitalize="none"
                      className="h-14 rounded-2xl bg-canvas border border-line px-5 text-ink font-sans-medium text-base mb-3"
                    />
                    <TextInput
                      value={signingSecret}
                      onChangeText={setSigningSecret}
                      placeholder="Signing secret / salt"
                      placeholderTextColor={colors.muted}
                      autoCapitalize="none"
                      secureTextEntry
                      className="h-14 rounded-2xl bg-canvas border border-line px-5 text-ink font-sans-medium text-base mb-3"
                    />
                  </>
                )}

                {error ? (
                  <Text className="text-danger font-sans-medium text-sm mb-3">{error}</Text>
                ) : null}

                <Button
                  title="Save credentials"
                  loading={connect.isPending}
                  disabled={!canSave}
                  onPress={() => {
                    setError("")
                    connect.mutate()
                  }}
                />
                {data.connected ? (
                  <Pressable
                    onPress={() => {
                      setEditing(false)
                      resetForm()
                    }}
                    className="h-11 items-center justify-center mt-2"
                  >
                    <Text variant="label" className="text-sm text-muted">
                      Cancel
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <View className="gap-3">
                <Button title="Replace credentials" variant="outline" onPress={() => setEditing(true)} />

                <Pressable
                  onPress={() => {
                    setReconcileMsg("")
                    reconcile.mutate()
                  }}
                  className="flex-row items-center justify-center gap-2 h-14 rounded-2xl bg-surface border border-line"
                >
                  <RefreshCw size={16} color={colors.ink} />
                  <Text variant="label" className="text-base">
                    {reconcile.isPending ? "Reconciling…" : "Reconcile now"}
                  </Text>
                </Pressable>
                {reconcileMsg ? (
                  <Text variant="muted" className="text-sm text-center">
                    {reconcileMsg}
                  </Text>
                ) : null}

                <Pressable
                  onPress={() => disconnect.mutate()}
                  className="h-12 items-center justify-center"
                >
                  <Text variant="label" className="text-sm text-danger">
                    {disconnect.isPending ? "Disconnecting…" : "Disconnect"}
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
