import { useState } from "react"
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Switch,
  Modal,
  TextInput,
  Image,
} from "react-native"
import { useRouter } from "expo-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { SafeAreaView } from "react-native-safe-area-context"
import QRCode from "react-native-qrcode-svg"
import * as Haptics from "expo-haptics"
import { ArrowLeft, Plus, QrCode, Trash2, X } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { ownerApi } from "@/lib/owner-api"
import { useOwnerRestaurant } from "@/lib/use-owner-restaurant"
import { useTheme } from "@/theme/theme-provider"

const WEB_BASE = process.env.EXPO_PUBLIC_API_URL || "https://visionmenu.app"

interface Table {
  id: string
  label: string
  section: string | null
  isActive: boolean
}

export default function OwnerTables() {
  const router = useRouter()
  const { colors } = useTheme()
  const queryClient = useQueryClient()
  const { restaurant } = useOwnerRestaurant()
  const rid = restaurant?.id

  const [addOpen, setAddOpen] = useState(false)
  const [label, setLabel] = useState("")
  const [section, setSection] = useState("")
  const [qrTable, setQrTable] = useState<Table | null>(null)
  const [anywhereOpen, setAnywhereOpen] = useState(false)

  const { data: tables, isLoading } = useQuery({
    queryKey: ["owner-tables", rid],
    queryFn: () => ownerApi.get<Table[]>(`/api/v1/restaurants/${rid}/tables`),
    enabled: !!rid,
  })

  const { data: qrData } = useQuery({
    queryKey: ["owner-table-qr", rid, qrTable?.id],
    queryFn: () =>
      ownerApi.get<{ url: string; qrDataUrl: string }>(
        `/api/v1/restaurants/${rid}/tables/${qrTable!.id}/qr`
      ),
    enabled: !!rid && !!qrTable,
  })

  const add = useMutation({
    mutationFn: () =>
      ownerApi.post(`/api/v1/restaurants/${rid}/tables`, {
        label: label.trim(),
        ...(section.trim() ? { section: section.trim() } : {}),
      }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      queryClient.invalidateQueries({ queryKey: ["owner-tables", rid] })
      setAddOpen(false)
      setLabel("")
      setSection("")
    },
  })

  const toggle = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) =>
      ownerApi.put(`/api/v1/restaurants/${rid}/tables/${id}`, { isActive: next }),
    onMutate: () => Haptics.selectionAsync(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-tables", rid] }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => ownerApi.delete(`/api/v1/restaurants/${rid}/tables/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-tables", rid] })
      setQrTable(null)
    },
  })

  const menuUrl = restaurant ? `${WEB_BASE}/${restaurant.slug}` : ""

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
            Tables & QR
          </Text>
        </View>
        <Pressable
          onPress={() => setAddOpen(true)}
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
          <Pressable
            onPress={() => setAnywhereOpen(true)}
            className="bg-surface rounded-3xl border border-line p-5 flex-row items-center gap-4 mb-6"
          >
            <View className="w-14 h-14 rounded-2xl bg-white items-center justify-center">
              {menuUrl ? <QRCode value={menuUrl} size={44} /> : null}
            </View>
            <View className="flex-1">
              <Text variant="title" className="text-base">
                Order-from-anywhere QR
              </Text>
              <Text variant="muted" className="text-xs">
                One code for your whole menu (no table)
              </Text>
            </View>
            <QrCode size={18} color={colors.muted} />
          </Pressable>

          {!tables || tables.length === 0 ? (
            <View className="items-center py-20">
              <Text variant="title" className="text-lg mb-1">
                No tables yet
              </Text>
              <Text variant="muted" className="text-base">
                Add a table to generate its QR code.
              </Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {tables.map((t) => (
                <View
                  key={t.id}
                  className="bg-surface rounded-2xl border border-line p-4 flex-row items-center gap-3"
                >
                  <View className="flex-1">
                    <Text variant="title" className="text-base">
                      {t.label}
                    </Text>
                    {t.section ? (
                      <Text variant="muted" className="text-xs">
                        {t.section}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={() => setQrTable(t)}
                    className="w-10 h-10 rounded-xl bg-canvas border border-line items-center justify-center"
                  >
                    <QrCode size={17} color={colors.ink} />
                  </Pressable>
                  <Switch
                    value={t.isActive}
                    onValueChange={(next) => toggle.mutate({ id: t.id, next })}
                    trackColor={{ false: colors.line, true: colors.primary }}
                    thumbColor="#FFF7F3"
                  />
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <Modal visible={addOpen} transparent animationType="fade" onRequestClose={() => setAddOpen(false)}>
        <Pressable
          onPress={() => setAddOpen(false)}
          className="flex-1 bg-black/60 items-center justify-center px-6"
        >
          <Pressable className="w-full bg-surface rounded-3xl border border-line p-6">
            <View className="flex-row items-center justify-between mb-5">
              <Text variant="heading" className="text-xl">
                New table
              </Text>
              <Pressable onPress={() => setAddOpen(false)}>
                <X size={20} color={colors.muted} />
              </Pressable>
            </View>
            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder="Label (e.g. T1, Patio 3)"
              placeholderTextColor={colors.muted}
              className="h-14 rounded-2xl bg-canvas border border-line px-5 text-ink font-sans-medium text-base mb-3"
            />
            <TextInput
              value={section}
              onChangeText={setSection}
              placeholder="Section (optional)"
              placeholderTextColor={colors.muted}
              className="h-14 rounded-2xl bg-canvas border border-line px-5 text-ink font-sans-medium text-base mb-5"
            />
            <Button
              title="Add table"
              loading={add.isPending}
              disabled={!label.trim()}
              onPress={() => add.mutate()}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={!!qrTable}
        transparent
        animationType="fade"
        onRequestClose={() => setQrTable(null)}
      >
        <Pressable
          onPress={() => setQrTable(null)}
          className="flex-1 bg-black/60 items-center justify-center px-6"
        >
          <Pressable className="w-full bg-surface rounded-3xl border border-line p-6 items-center">
            <View className="flex-row items-center justify-between w-full mb-5">
              <Text variant="heading" className="text-xl">
                {qrTable?.label}
              </Text>
              <Pressable onPress={() => setQrTable(null)}>
                <X size={20} color={colors.muted} />
              </Pressable>
            </View>

            <View className="w-56 h-56 bg-white rounded-2xl items-center justify-center mb-4">
              {qrData?.qrDataUrl ? (
                <Image
                  source={{ uri: qrData.qrDataUrl }}
                  style={{ width: 208, height: 208 }}
                  resizeMode="contain"
                />
              ) : (
                <ActivityIndicator color="#141110" />
              )}
            </View>
            {qrData?.url ? (
              <Text variant="muted" className="text-xs text-center mb-5" numberOfLines={1}>
                {qrData.url}
              </Text>
            ) : null}

            <Pressable
              onPress={() => qrTable && remove.mutate(qrTable.id)}
              className="flex-row items-center justify-center gap-2 h-11"
            >
              <Trash2 size={15} color={colors.danger} />
              <Text variant="label" className="text-sm text-danger">
                {remove.isPending ? "Deleting…" : "Delete table"}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={anywhereOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAnywhereOpen(false)}
      >
        <Pressable
          onPress={() => setAnywhereOpen(false)}
          className="flex-1 bg-black/60 items-center justify-center px-6"
        >
          <Pressable className="w-full bg-surface rounded-3xl border border-line p-6 items-center">
            <View className="flex-row items-center justify-between w-full mb-5">
              <Text variant="heading" className="text-xl">
                Menu QR
              </Text>
              <Pressable onPress={() => setAnywhereOpen(false)}>
                <X size={20} color={colors.muted} />
              </Pressable>
            </View>
            <View className="w-56 h-56 bg-white rounded-2xl items-center justify-center mb-4">
              {menuUrl ? <QRCode value={menuUrl} size={208} /> : null}
            </View>
            <Text variant="muted" className="text-xs text-center" numberOfLines={1}>
              {menuUrl}
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}
