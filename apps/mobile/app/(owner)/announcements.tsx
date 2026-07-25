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
import { ArrowLeft, Calendar, Clock, Plus, Trash2, X } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { ownerApi } from "@/lib/owner-api"
import { useOwnerRestaurant } from "@/lib/use-owner-restaurant"
import { useTheme } from "@/theme/theme-provider"

interface Announcement {
  id: string
  message: string
  isActive: boolean
  expiresAt: string | null
}

function isExpired(a: Announcement) {
  return !!a.expiresAt && new Date(a.expiresAt) < new Date()
}

function formatExpiry(iso: string) {
  const d = new Date(iso)
  return (
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) +
    " · " +
    d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  )
}

function splitLocalDateTime(iso: string) {
  const d = new Date(iso)
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  return { date, time }
}

function combineToIso(date: string, time: string) {
  if (!date.trim()) return undefined
  const parsed = new Date(`${date.trim()}T${time.trim() || "00:00"}`)
  if (isNaN(parsed.getTime())) return undefined
  return parsed.toISOString()
}

export default function OwnerAnnouncements() {
  const router = useRouter()
  const { colors } = useTheme()
  const queryClient = useQueryClient()
  const { restaurant } = useOwnerRestaurant()
  const rid = restaurant?.id

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [active, setActive] = useState(true)
  const [expiryDate, setExpiryDate] = useState("")
  const [expiryTime, setExpiryTime] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["owner-announcements", rid],
    queryFn: () => ownerApi.get<Announcement[]>(`/api/v1/restaurants/${rid}/announcements`),
    enabled: !!rid,
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["owner-announcements", rid] })

  const save = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> = { message: message.trim(), isActive: active }
      const expiresAt = combineToIso(expiryDate, expiryTime)
      if (expiresAt) body.expiresAt = expiresAt
      return editingId
        ? ownerApi.put(`/api/v1/restaurants/${rid}/announcements/${editingId}`, body)
        : ownerApi.post(`/api/v1/restaurants/${rid}/announcements`, body)
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      invalidate()
      close()
    },
  })

  const toggle = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) =>
      ownerApi.put(`/api/v1/restaurants/${rid}/announcements/${id}`, { isActive: next }),
    onMutate: () => Haptics.selectionAsync(),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => ownerApi.delete(`/api/v1/restaurants/${rid}/announcements/${id}`),
    onSuccess: invalidate,
  })

  function openNew() {
    setEditingId(null)
    setMessage("")
    setActive(true)
    setExpiryDate("")
    setExpiryTime("")
    setOpen(true)
  }
  function openEdit(a: Announcement) {
    setEditingId(a.id)
    setMessage(a.message)
    setActive(a.isActive)
    if (a.expiresAt) {
      const { date, time } = splitLocalDateTime(a.expiresAt)
      setExpiryDate(date)
      setExpiryTime(time)
    } else {
      setExpiryDate("")
      setExpiryTime("")
    }
    setOpen(true)
  }
  function close() {
    setOpen(false)
    setEditingId(null)
  }

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
            Announcements
          </Text>
        </View>
        <Pressable
          onPress={openNew}
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
          {!data || data.length === 0 ? (
            <View className="items-center py-24">
              <Text variant="title" className="text-lg mb-1">
                No announcements
              </Text>
              <Text variant="muted" className="text-base text-center">
                Post a banner that shows on your public menu.
              </Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {data.map((a) => (
                <View key={a.id} className="bg-surface rounded-2xl border border-line p-4">
                  <View className="flex-row items-start gap-3">
                    <Pressable className="flex-1" onPress={() => openEdit(a)}>
                      <Text variant="body" className="text-base leading-relaxed">
                        {a.message}
                      </Text>
                      <Text variant="muted" className="text-xs mt-1">
                        {!a.isActive ? "Hidden" : isExpired(a) ? "Expired" : "Live on your menu"}
                      </Text>
                      {a.expiresAt ? (
                        <View className="flex-row items-center gap-1 mt-1">
                          <Calendar size={11} color={colors.muted} />
                          <Text variant="muted" className="text-[11px]">
                            Expires {formatExpiry(a.expiresAt)}
                          </Text>
                        </View>
                      ) : null}
                    </Pressable>
                    <Switch
                      value={a.isActive}
                      onValueChange={(next) => toggle.mutate({ id: a.id, next })}
                      trackColor={{ false: colors.line, true: colors.primary }}
                      thumbColor="#FFF7F3"
                    />
                  </View>
                  <Pressable
                    onPress={() => remove.mutate(a.id)}
                    className="flex-row items-center gap-1.5 mt-2 self-start"
                  >
                    <Trash2 size={14} color={colors.danger} />
                    <Text variant="label" className="text-xs text-danger">
                      Delete
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <Pressable onPress={close} className="flex-1 bg-black/60 items-center justify-center px-6">
            <Pressable className="w-full bg-surface rounded-3xl border border-line p-6">
              <View className="flex-row items-center justify-between mb-5">
                <Text variant="heading" className="text-xl">
                  {editingId ? "Edit announcement" : "New announcement"}
                </Text>
                <Pressable onPress={close}>
                  <X size={20} color={colors.muted} />
                </Pressable>
              </View>

              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="e.g. Free dessert on orders over ₹500 today!"
                placeholderTextColor={colors.muted}
                multiline
                className="min-h-24 rounded-2xl bg-canvas border border-line px-5 py-4 text-ink font-sans-medium text-base mb-4"
              />

              <Text variant="muted" className="text-xs uppercase tracking-widest mb-1.5">
                Expiry date & time (optional)
              </Text>
              <View className="flex-row gap-3 mb-2">
                <View className="flex-1 flex-row items-center gap-2 h-14 rounded-2xl bg-canvas border border-line px-4">
                  <Calendar size={15} color={colors.muted} />
                  <TextInput
                    value={expiryDate}
                    onChangeText={(t) => setExpiryDate(t.replace(/[^\d-]/g, ""))}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.muted}
                    className="flex-1 text-ink font-sans-medium text-base"
                  />
                </View>
                <View className="w-28 flex-row items-center gap-2 h-14 rounded-2xl bg-canvas border border-line px-4">
                  <Clock size={15} color={colors.muted} />
                  <TextInput
                    value={expiryTime}
                    onChangeText={(t) => setExpiryTime(t.replace(/[^\d:]/g, ""))}
                    placeholder="HH:MM"
                    placeholderTextColor={colors.muted}
                    className="flex-1 text-ink font-sans-medium text-base"
                  />
                </View>
              </View>
              <Text variant="muted" className="text-xs mb-5">
                Leave blank to keep it active indefinitely
              </Text>

              <View className="flex-row items-center justify-between mb-5">
                <Text variant="body" className="text-base">
                  Show on menu
                </Text>
                <Switch
                  value={active}
                  onValueChange={setActive}
                  trackColor={{ false: colors.line, true: colors.primary }}
                  thumbColor="#FFF7F3"
                />
              </View>

              <Button
                title={editingId ? "Save" : "Post announcement"}
                loading={save.isPending}
                disabled={!message.trim()}
                onPress={() => save.mutate()}
              />
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}
