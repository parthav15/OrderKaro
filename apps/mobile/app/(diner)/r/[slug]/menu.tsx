import { useEffect, useState } from "react"
import { View, ScrollView, Pressable, ActivityIndicator } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { MotiView } from "moti"
import { Image } from "expo-image"
import { ArrowLeft, Plus, Box, ShoppingBag, Wallet as WalletIcon } from "lucide-react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { ItemDetailSheet } from "@/components/item-detail-sheet"
import { ArViewer } from "@/components/ar-viewer"
import { api } from "@/lib/api"
import { useCart } from "@/stores/cart"
import { useTheme } from "@/theme/theme-provider"
import type { MenuResponse, MenuItem } from "@/lib/types"

export default function MenuScreen() {
  const { slug, table } = useLocalSearchParams<{ slug: string; table?: string }>()
  const router = useRouter()
  const { colors } = useTheme()
  const setContext = useCart((s) => s.setContext)
  const itemCount = useCart((s) => s.itemCount())
  const subtotal = useCart((s) => s.subtotal())

  const [selected, setSelected] = useState<MenuItem | null>(null)
  const [arItem, setArItem] = useState<MenuItem | null>(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["menu", slug],
    queryFn: () => api.get<MenuResponse>(`/api/v1/public/restaurant/${slug}/menu`),
    enabled: !!slug,
  })

  useEffect(() => {
    if (!data) return
    if (!table) {
      setContext(data.restaurant.id, data.restaurant.slug, null)
      return
    }
    api
      .get<{ table?: { id: string } }>(`/api/v1/public/resolve-qr/${table}`)
      .then((qr) => setContext(data.restaurant.id, data.restaurant.slug, qr.table?.id ?? null))
      .catch(() => setContext(data.restaurant.id, data.restaurant.slug, null))
  }, [data, table, setContext])

  const brand = data?.restaurant.primaryColor || colors.primary

  if (isError) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-canvas items-center justify-center px-8">
        <Text variant="title" className="text-xl mb-2 text-center">
          Couldn't load this menu
        </Text>
        <Text variant="muted" className="text-base mb-6 text-center leading-relaxed">
          {error instanceof Error ? error.message : "Check the restaurant handle and try again."}
        </Text>
        <View className="flex-row gap-3">
          <Button title="Retry" onPress={() => refetch()} />
          <Button title="Back" variant="outline" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    )
  }

  if (isLoading || !data) {
    return (
      <SafeAreaView className="flex-1 bg-canvas items-center justify-center">
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <View className="flex-row items-center px-5 pb-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-surface border border-line items-center justify-center mr-3"
        >
          <ArrowLeft size={20} color={colors.ink} />
        </Pressable>
        <Text variant="muted" className="text-sm flex-1">
          Open until {data.restaurant.closingTime}
        </Text>
        <Pressable
          onPress={() => router.push({ pathname: "/(diner)/r/[slug]/wallet", params: { slug } })}
          className="w-10 h-10 rounded-full bg-surface border border-line items-center justify-center"
        >
          <WalletIcon size={18} color={colors.accent} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-2 pb-6">
          <Text variant="display" className="text-4xl leading-tight" style={{ color: brand }}>
            {data.restaurant.name}
          </Text>
          {data.restaurant.description ? (
            <Text variant="muted" className="text-base mt-2 leading-relaxed">
              {data.restaurant.description}
            </Text>
          ) : null}
        </View>

        {data.categories.map((category, ci) => (
          <View key={category.id} className="mb-8">
            <Text variant="muted" className="text-xs uppercase tracking-widest px-5 mb-1">
              From the kitchen
            </Text>
            <Text variant="heading" className="text-2xl px-5 mb-4">
              {category.name}
            </Text>
            <View className="px-5 gap-3">
              {category.items.map((item, ii) => (
                <MotiView
                  key={item.id}
                  from={{ opacity: 0, translateY: 14 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{
                    type: "spring",
                    damping: 20,
                    stiffness: 180,
                    delay: Math.min(ci * 60 + ii * 40, 400),
                  }}
                >
                  <Pressable onPress={() => setSelected(item)}>
                    <View className="flex-row bg-surface rounded-3xl border border-line overflow-hidden">
                      <View className="flex-1 p-4">
                        <View className="flex-row items-center gap-2 mb-1">
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
                          {item.model3dUrl ? (
                            <View className="flex-row items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5">
                              <Box size={10} color={colors.accent} />
                              <Text className="text-accent text-[10px] font-sans-bold">AR</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text variant="title" className="text-base mb-1">
                          {item.name}
                        </Text>
                        {item.description ? (
                          <Text variant="muted" className="text-sm leading-snug" numberOfLines={2}>
                            {item.description}
                          </Text>
                        ) : null}
                        <Text variant="price" className="text-lg mt-2" style={{ color: brand }}>
                          ₹{Number(item.price)}
                        </Text>
                      </View>

                      <View className="w-28 relative">
                        {item.imageUrl ? (
                          <Image
                            source={{ uri: item.imageUrl }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                          />
                        ) : (
                          <View className="flex-1 bg-surface-elevated" />
                        )}
                        <Pressable
                          onPress={() => setSelected(item)}
                          style={{ backgroundColor: brand }}
                          className="absolute bottom-2 right-2 w-9 h-9 rounded-full items-center justify-center"
                        >
                          <Plus size={18} color="#FFF7F3" strokeWidth={2.6} />
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                </MotiView>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {itemCount > 0 ? (
        <MotiView
          from={{ translateY: 100 }}
          animate={{ translateY: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 220 }}
          className="absolute bottom-8 left-5 right-5"
        >
          <Pressable
            onPress={() => router.push({ pathname: "/(diner)/r/[slug]/cart", params: { slug } })}
            style={{ backgroundColor: brand }}
            className="h-16 rounded-2xl flex-row items-center justify-between px-6"
          >
            <View className="flex-row items-center gap-2">
              <ShoppingBag size={20} color="#FFF7F3" />
              <Text className="text-[#FFF7F3] font-sans-bold text-base">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </Text>
            </View>
            <Text className="text-[#FFF7F3] font-sans-bold text-base">View cart · ₹{subtotal}</Text>
          </Pressable>
        </MotiView>
      ) : null}

      <ItemDetailSheet
        item={selected}
        brand={brand}
        onClose={() => setSelected(null)}
        onViewAr={(item) => {
          setSelected(null)
          setArItem(item)
        }}
      />

      {arItem?.model3dUrl ? (
        <ArViewer
          modelUrl={arItem.model3dUrl}
          posterUrl={arItem.model3dPosterUrl}
          itemName={arItem.name}
          onClose={() => setArItem(null)}
        />
      ) : null}
    </SafeAreaView>
  )
}
