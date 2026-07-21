import { useState } from "react"
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Switch,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { useRouter } from "expo-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { SafeAreaView } from "react-native-safe-area-context"
import * as Haptics from "expo-haptics"
import { ArrowLeft, Plus, Trash2, X } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { ownerApi } from "@/lib/owner-api"
import { useOwnerRestaurant } from "@/lib/use-owner-restaurant"
import { useTheme } from "@/theme/theme-provider"

type Role = "MANAGER" | "KITCHEN" | "COUNTER"
const ROLES: Role[] = ["MANAGER", "KITCHEN", "COUNTER"]

interface Staff {
  id: string
  name: string
  email: string
  role: Role
  isActive: boolean
}

export default function OwnerStaff() {
  const router = useRouter()
  const { colors } = useTheme()
  const queryClient = useQueryClient()
  const { restaurant } = useOwnerRestaurant()
  const rid = restaurant?.id

  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<Role>("KITCHEN")
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")

  const { data: staff, isLoading } = useQuery({
    queryKey: ["owner-staff", rid],
    queryFn: () => ownerApi.get<Staff[]>(`/api/v1/restaurants/${rid}/staff`),
    enabled: !!rid,
  })

  const add = useMutation({
    mutationFn: () =>
      ownerApi.post(`/api/v1/restaurants/${rid}/staff`, {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        ...(pin.length === 4 ? { pin } : {}),
      }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      queryClient.invalidateQueries({ queryKey: ["owner-staff", rid] })
      setOpen(false)
      setName("")
      setEmail("")
      setPassword("")
      setPin("")
      setRole("KITCHEN")
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not add staff"),
  })

  const toggle = useMutation({
    mutationFn: (id: string) => ownerApi.patch(`/api/v1/restaurants/${rid}/staff/${id}/toggle`),
    onMutate: () => Haptics.selectionAsync(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-staff", rid] }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => ownerApi.delete(`/api/v1/restaurants/${rid}/staff/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-staff", rid] }),
  })

  const valid = name.trim() && /\S+@\S+\.\S+/.test(email) && password.length >= 6

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <View className="flex-row items-center justify-between px-5 pb-3">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-surface border border-line items-center justify-center"
          >
            <ArrowLeft size={18} color={colors.ink} />
          </Pressable>
          <Text variant="heading" className="text-2xl">
            Staff
          </Text>
        </View>
        <Pressable
          onPress={() => {
            setError("")
            setOpen(true)
          }}
          className="w-11 h-11 rounded-full bg-primary items-center justify-center"
        >
          <Plus size={20} color="#FFF7F3" />
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 6, paddingBottom: 40 }}>
          {!staff || staff.length === 0 ? (
            <View className="items-center py-24">
              <Text variant="title" className="text-lg mb-1">
                No team members
              </Text>
              <Text variant="muted" className="text-base text-center">
                Add kitchen, counter or manager logins.
              </Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {staff.map((s) => (
                <View
                  key={s.id}
                  className="bg-surface rounded-2xl border border-line p-4 flex-row items-center gap-3"
                >
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text variant="title" className="text-base">
                        {s.name}
                      </Text>
                      <View className="rounded-full bg-canvas border border-line px-2 py-0.5">
                        <Text variant="muted" className="text-[10px] uppercase tracking-wide">
                          {s.role}
                        </Text>
                      </View>
                    </View>
                    <Text variant="muted" className="text-xs">
                      {s.email}
                    </Text>
                  </View>
                  <Switch
                    value={s.isActive}
                    onValueChange={() => toggle.mutate(s.id)}
                    trackColor={{ false: colors.line, true: colors.primary }}
                    thumbColor="#FFF7F3"
                  />
                  <Pressable onPress={() => remove.mutate(s.id)} className="p-1.5">
                    <Trash2 size={16} color={colors.danger} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <Pressable
            onPress={() => setOpen(false)}
            className="flex-1 bg-black/60 items-center justify-center px-6"
          >
            <Pressable className="w-full bg-surface rounded-3xl border border-line p-6">
              <View className="flex-row items-center justify-between mb-5">
                <Text variant="heading" className="text-xl">
                  New team member
                </Text>
                <Pressable onPress={() => setOpen(false)}>
                  <X size={20} color={colors.muted} />
                </Pressable>
              </View>

              <View className="gap-3 mb-4">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Full name"
                  placeholderTextColor={colors.muted}
                  className="h-14 rounded-2xl bg-canvas border border-line px-5 text-ink font-sans-medium text-base"
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className="h-14 rounded-2xl bg-canvas border border-line px-5 text-ink font-sans-medium text-base"
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Temporary password (min 6)"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  className="h-14 rounded-2xl bg-canvas border border-line px-5 text-ink font-sans-medium text-base"
                />
                <TextInput
                  value={pin}
                  onChangeText={(t) => setPin(t.replace(/\D/g, "").slice(0, 4))}
                  placeholder="4-digit shared-device PIN (optional)"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  className="h-14 rounded-2xl bg-canvas border border-line px-5 text-ink font-sans-medium text-base"
                />
              </View>

              <View className="flex-row gap-2 mb-5">
                {ROLES.map((r) => {
                  const active = role === r
                  return (
                    <Pressable
                      key={r}
                      onPress={() => setRole(r)}
                      className={`flex-1 h-11 rounded-2xl items-center justify-center border ${
                        active ? "bg-primary border-primary" : "bg-canvas border-line"
                      }`}
                    >
                      <Text
                        variant="label"
                        className={`text-xs ${active ? "text-[#FFF7F3]" : "text-ink"}`}
                      >
                        {r}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>

              {error ? (
                <Text className="text-danger font-sans-medium text-sm mb-3">{error}</Text>
              ) : null}

              <Button
                title="Add team member"
                loading={add.isPending}
                disabled={!valid}
                onPress={() => {
                  setError("")
                  add.mutate()
                }}
              />
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}
