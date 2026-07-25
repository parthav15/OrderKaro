import { useMemo, useState } from "react"
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { SafeAreaView } from "react-native-safe-area-context"
import * as Haptics from "expo-haptics"
import { ArrowLeft, Truck, Trash2 } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { ownerApi } from "@/lib/owner-api"
import { useOwnerRestaurant } from "@/lib/use-owner-restaurant"
import { useTheme } from "@/theme/theme-provider"
import type { Category, MenuItem } from "@/lib/types"

export default function MenuItemEditor() {
  const router = useRouter()
  const { colors } = useTheme()
  const queryClient = useQueryClient()
  const { restaurant } = useOwnerRestaurant()
  const rid = restaurant?.id
  const { itemId } = useLocalSearchParams<{ itemId?: string }>()
  const editing = !!itemId

  const { data } = useQuery({
    queryKey: ["owner-menu", rid],
    queryFn: () => ownerApi.get<Category[]>(`/api/v1/restaurants/${rid}/menu`),
    enabled: !!rid,
  })
  const categories = useMemo(() => data ?? [], [data])

  const existing = useMemo(() => {
    if (!itemId) return null
    for (const c of categories) {
      const found = c.items.find((it) => it.id === itemId)
      if (found) return { item: found as MenuItem, categoryId: c.id }
    }
    return null
  }, [categories, itemId])

  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? "")
  const [name, setName] = useState(existing?.item.name ?? "")
  const [description, setDescription] = useState(existing?.item.description ?? "")
  const [price, setPrice] = useState(existing ? String(Math.round(Number(existing.item.price))) : "")
  const [isVeg, setIsVeg] = useState(existing?.item.isVeg ?? true)
  const [availableForDelivery, setAvailableForDelivery] = useState(
    existing?.item.availableForDelivery ?? true
  )
  const [tags, setTags] = useState(existing?.item.tags.join(", ") ?? "")
  const [imageUrl, setImageUrl] = useState(existing?.item.imageUrl ?? "")
  const [error, setError] = useState("")

  const resolvedCategoryId = categoryId || categories[0]?.id || ""
  const priceNum = Number(price)
  const valid = !!resolvedCategoryId && name.trim().length > 0 && priceNum > 0

  const save = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> = {
        categoryId: resolvedCategoryId,
        name: name.trim(),
        description: description.trim(),
        price: priceNum,
        isVeg,
        availableForDelivery,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }
      if (imageUrl.trim()) body.imageUrl = imageUrl.trim()
      return editing
        ? ownerApi.put(`/api/v1/restaurants/${rid}/menu/items/${itemId}`, body)
        : ownerApi.post(`/api/v1/restaurants/${rid}/menu/items`, body)
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      queryClient.invalidateQueries({ queryKey: ["owner-menu", rid] })
      router.back()
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not save"),
  })

  const remove = useMutation({
    mutationFn: () => ownerApi.delete(`/api/v1/restaurants/${rid}/menu/items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-menu", rid] })
      router.back()
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not delete"),
  })

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-row items-center gap-3 px-5 pb-2">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-surface border border-line items-center justify-center"
          >
            <ArrowLeft size={18} color={colors.ink} />
          </Pressable>
          <Text variant="heading" className="text-2xl">
            {editing ? "Edit dish" : "New dish"}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="muted" className="text-xs uppercase tracking-widest mb-2">
            Category
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            className="mb-5"
          >
            {categories.map((c) => {
              const active = resolvedCategoryId === c.id
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCategoryId(c.id)}
                  className={`h-10 px-4 rounded-full items-center justify-center border ${
                    active ? "bg-primary border-primary" : "bg-surface border-line"
                  }`}
                >
                  <Text
                    variant="label"
                    className="text-sm"
                    style={{ color: active ? colors.onPrimary : colors.ink }}
                  >
                    {c.name}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>

          <View className="gap-3">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Dish name"
              placeholderTextColor={colors.muted}
              className="h-14 rounded-2xl bg-surface border border-line px-5 text-ink font-sans-medium text-base"
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Description (optional)"
              placeholderTextColor={colors.muted}
              multiline
              className="min-h-14 rounded-2xl bg-surface border border-line px-5 py-4 text-ink font-sans-medium text-base"
            />
            <TextInput
              value={price}
              onChangeText={(t) => setPrice(t.replace(/[^\d]/g, ""))}
              placeholder="Price (₹)"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              className="h-14 rounded-2xl bg-surface border border-line px-5 text-ink font-sans-medium text-base"
            />
            <TextInput
              value={tags}
              onChangeText={setTags}
              placeholder="Tags, comma separated"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              className="h-14 rounded-2xl bg-surface border border-line px-5 text-ink font-sans-medium text-base"
            />
            <TextInput
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="Image URL (optional)"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              keyboardType="url"
              className="h-14 rounded-2xl bg-surface border border-line px-5 text-ink font-sans-medium text-base"
            />

            <View className="flex-row items-center justify-between bg-surface rounded-2xl border border-line px-5 h-14">
              <Text variant="title" className="text-base">
                Vegetarian
              </Text>
              <Switch
                value={isVeg}
                onValueChange={setIsVeg}
                trackColor={{ false: colors.line, true: colors.success }}
                thumbColor="#FFF7F3"
              />
            </View>

            <View className="flex-row items-center justify-between bg-surface rounded-2xl border border-line px-5 h-14">
              <View className="flex-row items-center gap-2.5">
                <Truck size={16} color={colors.muted} />
                <Text variant="title" className="text-base">
                  Available for delivery
                </Text>
              </View>
              <Switch
                value={availableForDelivery}
                onValueChange={setAvailableForDelivery}
                trackColor={{ false: colors.line, true: colors.primary }}
                thumbColor="#FFF7F3"
              />
            </View>
          </View>

          {error ? (
            <Text className="text-danger font-sans-medium text-sm mt-4">{error}</Text>
          ) : null}

          <View className="mt-6">
            <Button
              title={editing ? "Save changes" : "Add dish"}
              loading={save.isPending}
              disabled={!valid}
              onPress={() => {
                setError("")
                save.mutate()
              }}
            />
          </View>

          {editing ? (
            <Pressable
              onPress={() => remove.mutate()}
              className="flex-row items-center justify-center gap-2 h-12 mt-3"
            >
              <Trash2 size={16} color={colors.danger} />
              <Text variant="label" className="text-sm text-danger">
                {remove.isPending ? "Deleting…" : "Delete dish"}
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
