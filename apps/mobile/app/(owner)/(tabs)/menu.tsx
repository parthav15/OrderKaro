import { useState } from "react"
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Switch,
  Modal,
  TextInput,
  RefreshControl,
} from "react-native"
import { useRouter } from "expo-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { SafeAreaView } from "react-native-safe-area-context"
import * as Haptics from "expo-haptics"
import { Plus, FolderPlus, X, Trash2, Pencil } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { ownerApi } from "@/lib/owner-api"
import { useOwnerRestaurant } from "@/lib/use-owner-restaurant"
import { useTheme } from "@/theme/theme-provider"
import type { Category } from "@/lib/types"

function money(v: string | number) {
  return `₹${Math.round(Number(v))}`
}

export default function OwnerMenu() {
  const router = useRouter()
  const { colors } = useTheme()
  const queryClient = useQueryClient()
  const { restaurant } = useOwnerRestaurant()
  const rid = restaurant?.id

  const [catModal, setCatModal] = useState(false)
  const [editingCat, setEditingCat] = useState<{ id: string; name: string; description: string } | null>(null)
  const [catName, setCatName] = useState("")
  const [catDesc, setCatDesc] = useState("")

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["owner-menu", rid],
    queryFn: () => ownerApi.get<{ categories: Category[] }>(`/api/v1/restaurants/${rid}/menu`),
    enabled: !!rid,
  })

  const categories = data?.categories ?? []

  const toggle = useMutation({
    mutationFn: ({ itemId, next }: { itemId: string; next: boolean }) =>
      ownerApi.patch(`/api/v1/restaurants/${rid}/menu/items/${itemId}/availability`, {
        isAvailable: next,
      }),
    onMutate: () => Haptics.selectionAsync(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-menu", rid] }),
  })

  const saveCat = useMutation({
    mutationFn: () => {
      const body = { name: catName.trim(), description: catDesc.trim() }
      return editingCat
        ? ownerApi.put(`/api/v1/restaurants/${rid}/categories/${editingCat.id}`, body)
        : ownerApi.post(`/api/v1/restaurants/${rid}/categories`, body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-menu", rid] })
      closeCat()
    },
  })

  const deleteCat = useMutation({
    mutationFn: (id: string) => ownerApi.delete(`/api/v1/restaurants/${rid}/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-menu", rid] })
      closeCat()
    },
  })

  function openNewCat() {
    setEditingCat(null)
    setCatName("")
    setCatDesc("")
    setCatModal(true)
  }
  function openEditCat(cat: Category) {
    setEditingCat({ id: cat.id, name: cat.name, description: "" })
    setCatName(cat.name)
    setCatDesc("")
    setCatModal(true)
  }
  function closeCat() {
    setCatModal(false)
    setEditingCat(null)
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <View className="flex-row items-center justify-between px-5 pb-4">
        <View>
          <Text variant="muted" className="text-xs tracking-widest uppercase">
            Menu
          </Text>
          <Text variant="heading" className="text-2xl">
            {restaurant?.name ?? "Menu"}
          </Text>
        </View>
        <View className="flex-row gap-2">
          <Pressable
            onPress={openNewCat}
            className="w-11 h-11 rounded-full bg-surface border border-line items-center justify-center"
          >
            <FolderPlus size={18} color={colors.ink} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/(owner)/menu-item")}
            className="w-11 h-11 rounded-full bg-primary items-center justify-center"
          >
            <Plus size={20} color="#FFF7F3" />
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingTop: 4, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
        >
          {categories.length === 0 ? (
            <View className="items-center py-24">
              <Text variant="title" className="text-lg mb-1">
                No menu yet
              </Text>
              <Text variant="muted" className="text-base text-center">
                Add a category, then start adding dishes.
              </Text>
            </View>
          ) : (
            categories.map((cat) => (
              <View key={cat.id} className="mb-7">
                <View className="flex-row items-center justify-between mb-3">
                  <Text variant="heading" className="text-xl">
                    {cat.name}
                  </Text>
                  <Pressable onPress={() => openEditCat(cat)} className="p-1.5">
                    <Pencil size={15} color={colors.muted} />
                  </Pressable>
                </View>

                {cat.items.length === 0 ? (
                  <Text variant="muted" className="text-sm mb-2">
                    No dishes in this category yet.
                  </Text>
                ) : (
                  <View className="gap-2.5">
                    {cat.items.map((item) => (
                      <Pressable
                        key={item.id}
                        onPress={() =>
                          router.push({
                            pathname: "/(owner)/menu-item",
                            params: { itemId: item.id },
                          })
                        }
                        className="bg-surface rounded-2xl border border-line p-4 flex-row items-center gap-3"
                      >
                        <View
                          className={`w-3.5 h-3.5 rounded-sm border ${
                            item.isVeg ? "border-success" : "border-danger"
                          } items-center justify-center`}
                        >
                          <View
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.isVeg ? "bg-success" : "bg-danger"
                            }`}
                          />
                        </View>
                        <View className="flex-1">
                          <Text
                            variant="title"
                            className={`text-base ${item.isAvailable ? "" : "opacity-40"}`}
                          >
                            {item.name}
                          </Text>
                          <Text variant="price" className="text-sm">
                            {money(item.price)}
                          </Text>
                        </View>
                        <Switch
                          value={item.isAvailable}
                          onValueChange={(next) => toggle.mutate({ itemId: item.id, next })}
                          trackColor={{ false: colors.line, true: colors.primary }}
                          thumbColor="#FFF7F3"
                        />
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}

      <Modal visible={catModal} transparent animationType="fade" onRequestClose={closeCat}>
        <Pressable onPress={closeCat} className="flex-1 bg-black/60 items-center justify-center px-6">
          <Pressable className="w-full bg-surface rounded-3xl border border-line p-6">
            <View className="flex-row items-center justify-between mb-5">
              <Text variant="heading" className="text-xl">
                {editingCat ? "Edit category" : "New category"}
              </Text>
              <Pressable onPress={closeCat}>
                <X size={20} color={colors.muted} />
              </Pressable>
            </View>

            <TextInput
              value={catName}
              onChangeText={setCatName}
              placeholder="Category name"
              placeholderTextColor={colors.muted}
              className="h-14 rounded-2xl bg-canvas border border-line px-5 text-ink font-sans-medium text-base mb-3"
            />
            <TextInput
              value={catDesc}
              onChangeText={setCatDesc}
              placeholder="Description (optional)"
              placeholderTextColor={colors.muted}
              className="h-14 rounded-2xl bg-canvas border border-line px-5 text-ink font-sans-medium text-base mb-5"
            />

            <Button
              title={editingCat ? "Save changes" : "Create category"}
              loading={saveCat.isPending}
              disabled={!catName.trim()}
              onPress={() => saveCat.mutate()}
            />

            {editingCat ? (
              <Pressable
                onPress={() => deleteCat.mutate(editingCat.id)}
                className="flex-row items-center justify-center gap-2 h-12 mt-3"
              >
                <Trash2 size={16} color={colors.danger} />
                <Text variant="label" className="text-sm text-danger">
                  Delete category
                </Text>
              </Pressable>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}
