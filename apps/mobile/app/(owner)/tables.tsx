import { useMemo, useState } from "react"
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Switch,
  Modal,
  TextInput,
  Image,
  Share,
} from "react-native"
import { useRouter } from "expo-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MotiView, AnimatePresence } from "moti"
import { SafeAreaView } from "react-native-safe-area-context"
import QRCode from "react-native-qrcode-svg"
import * as Haptics from "expo-haptics"
import { ArrowLeft, Pencil, Plus, QrCode, Share2, Trash2, X } from "lucide-react-native"
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

type QrTab = "code" | "poster" | "share"

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
  const [qrTab, setQrTab] = useState<QrTab>("code")
  const [anywhereOpen, setAnywhereOpen] = useState(false)

  const [editTable, setEditTable] = useState<Table | null>(null)
  const [editLabel, setEditLabel] = useState("")
  const [editSection, setEditSection] = useState("")
  const [editActive, setEditActive] = useState(true)

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

  const update = useMutation({
    mutationFn: () =>
      ownerApi.put(`/api/v1/restaurants/${rid}/tables/${editTable!.id}`, {
        label: editLabel.trim(),
        section: editSection.trim() || null,
        isActive: editActive,
      }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      queryClient.invalidateQueries({ queryKey: ["owner-tables", rid] })
      setEditTable(null)
    },
  })

  function openEdit(t: Table) {
    setEditTable(t)
    setEditLabel(t.label)
    setEditSection(t.section ?? "")
    setEditActive(t.isActive)
  }

  function openQr(t: Table) {
    setQrTab("code")
    setQrTable(t)
  }

  function shareTable(t: Table, url?: string) {
    if (!url) return
    Share.share({
      message: `${restaurant?.name ?? "Order"} · Scan to order at ${t.label}\n${url}`,
      url,
    })
  }

  const sectionSuggestions = useMemo(() => {
    const names = (tables ?? [])
      .map((t) => t.section)
      .filter((s): s is string => !!s && s.trim().length > 0)
    return Array.from(new Set(names))
  }, [tables])

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
                  <Pressable onPress={() => openEdit(t)} className="flex-1">
                    <Text variant="title" className="text-base">
                      {t.label}
                    </Text>
                    {t.section ? (
                      <Text variant="muted" className="text-xs">
                        {t.section}
                      </Text>
                    ) : null}
                  </Pressable>
                  <Pressable
                    onPress={() => openEdit(t)}
                    className="w-10 h-10 rounded-xl bg-canvas border border-line items-center justify-center"
                  >
                    <Pencil size={16} color={colors.ink} />
                  </Pressable>
                  <Pressable
                    onPress={() => openQr(t)}
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
        visible={!!editTable}
        transparent
        animationType="fade"
        onRequestClose={() => setEditTable(null)}
      >
        <Pressable
          onPress={() => setEditTable(null)}
          className="flex-1 bg-black/60 items-center justify-center px-6"
        >
          <Pressable className="w-full bg-surface rounded-3xl border border-line p-6">
            <View className="flex-row items-center justify-between mb-5">
              <Text variant="heading" className="text-xl">
                Edit table
              </Text>
              <Pressable onPress={() => setEditTable(null)}>
                <X size={20} color={colors.muted} />
              </Pressable>
            </View>
            <TextInput
              value={editLabel}
              onChangeText={setEditLabel}
              placeholder="Label (e.g. T1, Patio 3)"
              placeholderTextColor={colors.muted}
              className="h-14 rounded-2xl bg-canvas border border-line px-5 text-ink font-sans-medium text-base mb-3"
            />
            <TextInput
              value={editSection}
              onChangeText={setEditSection}
              placeholder="Section (optional)"
              placeholderTextColor={colors.muted}
              className="h-14 rounded-2xl bg-canvas border border-line px-5 text-ink font-sans-medium text-base mb-3"
            />
            {sectionSuggestions.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6 }}
                className="mb-4"
              >
                {sectionSuggestions.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setEditSection(s)}
                    className="h-8 px-3 rounded-full items-center justify-center bg-canvas border border-line"
                  >
                    <Text variant="label" className="text-xs">
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}
            <View className="flex-row items-center justify-between bg-canvas rounded-2xl border border-line px-5 h-14 mb-5">
              <View>
                <Text variant="title" className="text-sm">
                  Active
                </Text>
                <Text variant="muted" className="text-xs">
                  Inactive tables are hidden from QR scans
                </Text>
              </View>
              <Switch
                value={editActive}
                onValueChange={setEditActive}
                trackColor={{ false: colors.line, true: colors.primary }}
                thumbColor="#FFF7F3"
              />
            </View>
            <Button
              title="Save changes"
              loading={update.isPending}
              disabled={!editLabel.trim()}
              onPress={() => update.mutate()}
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
            <View className="flex-row items-center justify-between w-full mb-4">
              <Text variant="heading" className="text-xl">
                {qrTable?.label}
              </Text>
              <Pressable onPress={() => setQrTable(null)}>
                <X size={20} color={colors.muted} />
              </Pressable>
            </View>

            <View className="flex-row bg-canvas rounded-2xl border border-line p-1 mb-5 w-full">
              {(["code", "poster", "share"] as QrTab[]).map((tab) => (
                <Pressable
                  key={tab}
                  onPress={() => setQrTab(tab)}
                  className={`flex-1 h-9 rounded-xl items-center justify-center ${
                    qrTab === tab ? "bg-surface" : ""
                  }`}
                >
                  <Text
                    variant="label"
                    className="text-[11px] uppercase tracking-widest"
                    style={{ color: qrTab === tab ? colors.ink : colors.muted }}
                  >
                    {tab}
                  </Text>
                </Pressable>
              ))}
            </View>

            <AnimatePresence>
              {qrTab === "code" ? (
                <MotiView
                  key="code"
                  from={{ opacity: 0, translateY: 6 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  exit={{ opacity: 0 }}
                  className="w-full items-center"
                >
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
                    <Text variant="muted" className="text-xs text-center mb-2" numberOfLines={1}>
                      {qrData.url}
                    </Text>
                  ) : null}
                </MotiView>
              ) : null}

              {qrTab === "poster" ? (
                <MotiView
                  key="poster"
                  from={{ opacity: 0, translateY: 6 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  exit={{ opacity: 0 }}
                  className="w-full items-center mb-2"
                >
                  <View className="w-full rounded-2xl bg-canvas border border-line p-5 items-center">
                    <View className="w-full flex-row items-center gap-2.5 mb-6">
                      <View className="w-1 h-7 rounded-full bg-primary" />
                      <View>
                        <Text variant="heading" className="text-base">
                          Vision Menu
                        </Text>
                        <Text variant="muted" className="text-[10px]" numberOfLines={1}>
                          {restaurant?.name}
                        </Text>
                      </View>
                    </View>
                    <Text variant="display" className="text-2xl text-center mb-1">
                      Scan to Order
                    </Text>
                    <Text variant="muted" className="text-xs text-center mb-6">
                      No queue. No wait. Just scan.
                    </Text>
                    <View className="w-40 h-40 bg-white rounded-2xl border border-ink items-center justify-center mb-6">
                      {qrData?.qrDataUrl ? (
                        <Image
                          source={{ uri: qrData.qrDataUrl }}
                          style={{ width: 136, height: 136 }}
                          resizeMode="contain"
                        />
                      ) : (
                        <ActivityIndicator color="#141110" />
                      )}
                    </View>
                    <Text variant="title" className="text-xl mb-1">
                      {qrTable?.label}
                    </Text>
                    {qrTable?.section ? (
                      <Text variant="muted" className="text-[10px] tracking-[3px] uppercase mb-5">
                        {qrTable.section}
                      </Text>
                    ) : (
                      <View className="mb-5" />
                    )}
                    <View className="w-full h-px bg-primary mb-2" />
                    <Text variant="muted" className="text-[10px]">
                      Powered by Vision Menu
                    </Text>
                  </View>
                </MotiView>
              ) : null}

              {qrTab === "share" ? (
                <MotiView
                  key="share"
                  from={{ opacity: 0, translateY: 6 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  exit={{ opacity: 0 }}
                  className="w-full mb-2"
                >
                  <View className="w-full bg-canvas border border-line rounded-2xl p-4 mb-4">
                    <View className="flex-row items-center gap-1.5 mb-1.5">
                      <Share2 size={12} color={colors.muted} />
                      <Text variant="muted" className="text-[10px] uppercase tracking-widest">
                        Direct URL
                      </Text>
                    </View>
                    <Text variant="body" className="text-sm" numberOfLines={2}>
                      {qrData?.url ?? "—"}
                    </Text>
                  </View>
                  <Button
                    title="Share table link"
                    variant="outline"
                    disabled={!qrData?.url}
                    onPress={() => qrTable && shareTable(qrTable, qrData?.url)}
                  />
                </MotiView>
              ) : null}
            </AnimatePresence>

            <Pressable
              onPress={() => qrTable && remove.mutate(qrTable.id)}
              className="flex-row items-center justify-center gap-2 h-11 mt-3"
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
