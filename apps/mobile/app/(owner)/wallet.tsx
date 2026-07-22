import { useMemo, useState } from "react"
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { useRouter } from "expo-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { SafeAreaView } from "react-native-safe-area-context"
import * as Haptics from "expo-haptics"
import { ArrowLeft, X, Search } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { ownerApi } from "@/lib/owner-api"
import { useOwnerRestaurant } from "@/lib/use-owner-restaurant"
import { useTheme } from "@/theme/theme-provider"

interface RechargeRequest {
  id: string
  amount: string
  description?: string | null
  wallet?: { consumer?: { name?: string | null; phone?: string | null } }
}
interface Consumer {
  id: string
  name: string
  phone: string
  wallet: { balance: string } | null
}
interface WalletTransaction {
  id?: string
  type: "CREDIT" | "DEBIT"
  amount: string
  description?: string | null
  consumer?: { name?: string | null; phone?: string | null }
  createdAt?: string
}

type Tab = "requests" | "activity" | "customers"

function money(v: string | number) {
  return `₹${Math.round(Number(v)).toLocaleString("en-IN")}`
}

export default function OwnerWallet() {
  const router = useRouter()
  const { colors } = useTheme()
  const queryClient = useQueryClient()
  const { restaurant } = useOwnerRestaurant()
  const rid = restaurant?.id

  const [tab, setTab] = useState<Tab>("requests")
  const [search, setSearch] = useState("")
  const [creditFor, setCreditFor] = useState<Consumer | null>(null)
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")

  const { data: requests, isLoading: loadingRequests } = useQuery({
    queryKey: ["owner-wallet-requests", rid],
    queryFn: () => ownerApi.get<RechargeRequest[]>(`/api/v1/restaurants/${rid}/wallet/requests`),
    enabled: !!rid,
    refetchInterval: 15000,
  })

  const { data: consumersData, isLoading: loadingConsumers } = useQuery({
    queryKey: ["owner-consumers", rid],
    queryFn: () => ownerApi.get<{ consumers: Consumer[] }>(`/api/v1/restaurants/${rid}/consumers`),
    enabled: !!rid,
  })

  const { data: activity, isLoading: loadingActivity } = useQuery({
    queryKey: ["owner-wallet-activity", rid],
    queryFn: () =>
      ownerApi.get<WalletTransaction[]>(`/api/v1/restaurants/${rid}/wallet/transactions?limit=20`),
    enabled: !!rid,
    refetchInterval: 30000,
  })

  const consumers = consumersData?.consumers ?? []
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return consumers
    return consumers.filter(
      (c) => c.name?.toLowerCase().includes(q) || c.phone?.includes(q)
    )
  }, [consumers, search])

  const kpis = useMemo(() => {
    const withWallet = consumers.filter((c) => c.wallet)
    const totalBalance = withWallet.reduce((s, c) => s + Number(c.wallet?.balance || 0), 0)
    const pendingAmount = (requests ?? []).reduce((s, r) => s + Number(r.amount), 0)
    return {
      customers: consumers.length,
      totalBalance,
      pending: requests?.length ?? 0,
      pendingAmount,
    }
  }, [consumers, requests])

  const decide = useMutation({
    mutationFn: ({ reqId, status }: { reqId: string; status: "APPROVED" | "REJECTED" }) =>
      ownerApi.patch(`/api/v1/restaurants/${rid}/wallet/requests/${reqId}`, { status }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      queryClient.invalidateQueries({ queryKey: ["owner-wallet-requests", rid] })
      queryClient.invalidateQueries({ queryKey: ["owner-consumers", rid] })
      queryClient.invalidateQueries({ queryKey: ["owner-wallet-activity", rid] })
    },
  })

  const credit = useMutation({
    mutationFn: () =>
      ownerApi.post(`/api/v1/restaurants/${rid}/wallet/credit`, {
        consumerId: creditFor!.id,
        amount: Number(amount),
        ...(reason.trim() ? { description: reason.trim() } : {}),
      }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      queryClient.invalidateQueries({ queryKey: ["owner-consumers", rid] })
      queryClient.invalidateQueries({ queryKey: ["owner-wallet-activity", rid] })
      setCreditFor(null)
      setAmount("")
      setReason("")
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not credit wallet"),
  })

  const TABS: Array<{ id: Tab; label: string }> = [
    { id: "requests", label: `Requests${kpis.pending ? ` (${kpis.pending})` : ""}` },
    { id: "activity", label: "Activity" },
    { id: "customers", label: "Customers" },
  ]

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <View className="flex-row items-center gap-3 px-5 pb-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-surface border border-line items-center justify-center"
        >
          <ArrowLeft size={18} color={colors.ink} />
        </Pressable>
        <Text variant="heading" className="text-2xl">
          Wallet
        </Text>
      </View>

      <View className="flex-row gap-2 px-5 mb-3">
        <View className="flex-1 bg-surface rounded-2xl border border-line p-3">
          <Text variant="muted" className="text-[11px] mb-1">
            Balances held
          </Text>
          <Text variant="title" className="text-lg">
            {money(kpis.totalBalance)}
          </Text>
        </View>
        <View className="flex-1 bg-surface rounded-2xl border border-line p-3">
          <Text variant="muted" className="text-[11px] mb-1">
            Pending
          </Text>
          <Text variant="title" className="text-lg">
            {money(kpis.pendingAmount)}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-2 px-5 mb-3">
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setTab(t.id)}
            className={`flex-1 h-10 rounded-full items-center justify-center border ${
              tab === t.id ? "bg-primary border-primary" : "bg-surface border-line"
            }`}
          >
            <Text
              variant="label"
              className="text-[13px]"
              style={{ color: tab === t.id ? colors.onPrimary : colors.ink }}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 6, paddingBottom: 40 }}>
        {tab === "requests" ? (
          loadingRequests ? (
            <ActivityIndicator color={colors.primary} />
          ) : !requests || requests.length === 0 ? (
            <Text variant="muted" className="text-base text-center py-20">
              No pending recharge requests.
            </Text>
          ) : (
            <View className="gap-2.5">
              {requests.map((r) => (
                <View key={r.id} className="bg-surface rounded-2xl border border-line p-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <View>
                      <Text variant="title" className="text-base">
                        {r.wallet?.consumer?.name ?? "Customer"}
                      </Text>
                      <Text variant="muted" className="text-xs">
                        {r.wallet?.consumer?.phone ?? ""}
                      </Text>
                    </View>
                    <Text variant="price" className="text-lg">
                      {money(r.amount)}
                    </Text>
                  </View>
                  {r.description ? (
                    <Text variant="muted" className="text-sm mb-3">
                      {r.description}
                    </Text>
                  ) : null}
                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <Button
                        title="Reject"
                        variant="outline"
                        onPress={() => decide.mutate({ reqId: r.id, status: "REJECTED" })}
                      />
                    </View>
                    <View className="flex-[2]">
                      <Button
                        title="Approve & credit"
                        loading={decide.isPending && decide.variables?.reqId === r.id}
                        onPress={() => decide.mutate({ reqId: r.id, status: "APPROVED" })}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )
        ) : null}

        {tab === "activity" ? (
          loadingActivity ? (
            <ActivityIndicator color={colors.primary} />
          ) : !activity || activity.length === 0 ? (
            <Text variant="muted" className="text-base text-center py-20">
              No transactions yet.
            </Text>
          ) : (
            <View className="bg-surface rounded-3xl border border-line overflow-hidden">
              {activity.map((tx, i) => (
                <View
                  key={tx.id ?? i}
                  className={`flex-row items-center justify-between px-4 py-3.5 ${
                    i > 0 ? "border-t border-line" : ""
                  }`}
                >
                  <View className="flex-1 pr-3">
                    <Text variant="title" className="text-sm">
                      {tx.consumer?.name ?? "Customer"}
                    </Text>
                    <Text variant="muted" className="text-xs" numberOfLines={1}>
                      {tx.description ?? tx.consumer?.phone ?? ""}
                    </Text>
                  </View>
                  <Text
                    variant="title"
                    className={`text-base ${tx.type === "CREDIT" ? "text-success" : "text-danger"}`}
                  >
                    {tx.type === "CREDIT" ? "+" : "−"}
                    {money(tx.amount)}
                  </Text>
                </View>
              ))}
            </View>
          )
        ) : null}

        {tab === "customers" ? (
          <>
            <View className="flex-row items-center gap-2 bg-surface rounded-2xl border border-line px-4 h-12 mb-3">
              <Search size={16} color={colors.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search name or phone"
                placeholderTextColor={colors.muted}
                className="flex-1 text-ink font-sans-medium text-base"
              />
            </View>
            {loadingConsumers ? (
              <ActivityIndicator color={colors.primary} />
            ) : filtered.length === 0 ? (
              <Text variant="muted" className="text-base text-center py-16">
                No customers found.
              </Text>
            ) : (
              <View className="gap-2.5">
                {filtered.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => {
                      setError("")
                      setAmount("")
                      setReason("")
                      setCreditFor(c)
                    }}
                    className="bg-surface rounded-2xl border border-line p-4 flex-row items-center justify-between"
                  >
                    <View>
                      <Text variant="title" className="text-base">
                        {c.name}
                      </Text>
                      <Text variant="muted" className="text-xs">
                        {c.phone}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text variant="price" className="text-base">
                        {money(c.wallet?.balance ?? 0)}
                      </Text>
                      <Text variant="muted" className="text-[11px]">
                        Tap to credit
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        ) : null}
      </ScrollView>

      <Modal
        visible={!!creditFor}
        transparent
        animationType="fade"
        onRequestClose={() => setCreditFor(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <Pressable
            onPress={() => setCreditFor(null)}
            className="flex-1 bg-black/60 items-center justify-center px-6"
          >
            <Pressable className="w-full bg-surface rounded-3xl border border-line p-6">
              <View className="flex-row items-center justify-between mb-1">
                <Text variant="heading" className="text-xl">
                  Credit wallet
                </Text>
                <Pressable onPress={() => setCreditFor(null)}>
                  <X size={20} color={colors.muted} />
                </Pressable>
              </View>
              <Text variant="muted" className="text-sm mb-5">
                {creditFor?.name} · {creditFor?.phone}
              </Text>

              <TextInput
                value={amount}
                onChangeText={(t) => setAmount(t.replace(/[^\d]/g, ""))}
                placeholder="Amount (₹)"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                autoFocus
                className="h-14 rounded-2xl bg-canvas border border-line px-5 text-ink font-sans-bold text-2xl mb-3"
              />
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Reason (optional)"
                placeholderTextColor={colors.muted}
                className="h-14 rounded-2xl bg-canvas border border-line px-5 text-ink font-sans-medium text-base mb-3"
              />

              {error ? (
                <Text className="text-danger font-sans-medium text-sm mb-3">{error}</Text>
              ) : null}

              <Button
                title="Add credit"
                loading={credit.isPending}
                disabled={Number(amount) <= 0}
                onPress={() => {
                  setError("")
                  credit.mutate()
                }}
              />
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}
