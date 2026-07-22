import { useEffect, useMemo, useRef, useState } from "react"
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { MotiView } from "moti"
import { Image } from "expo-image"
import {
  ArrowLeft,
  Plus,
  Box,
  ShoppingBag,
  Wallet as WalletIcon,
  Search,
  Leaf,
  X,
} from "lucide-react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { ItemDetailSheet } from "@/components/item-detail-sheet"
import { ArViewer } from "@/components/ar-viewer"
import { api } from "@/lib/api"
import { useCart } from "@/stores/cart"
import { useTheme } from "@/theme/theme-provider"
import type { MenuResponse, MenuItem, Category } from "@/lib/types"

const POPULAR = /popular|chef|signature|special|featured|bestseller|recommended/i

type VegFilter = "ALL" | "VEG" | "NONVEG"

export default function MenuScreen() {
  const { slug, table } = useLocalSearchParams<{ slug: string; table?: string }>()
  const router = useRouter()
  const { colors } = useTheme()
  const setContext = useCart((s) => s.setContext)
  const itemCount = useCart((s) => s.itemCount())
  const subtotal = useCart((s) => s.subtotal())

  const [selected, setSelected] = useState<MenuItem | null>(null)
  const [arItem, setArItem] = useState<MenuItem | null>(null)
  const [search, setSearch] = useState("")
  const [veg, setVeg] = useState<VegFilter>("ALL")
  const [arOnly, setArOnly] = useState(false)
  const [activeCat, setActiveCat] = useState<string>("")

  const scrollRef = useRef<ScrollView>(null)
  const offsets = useRef<Record<string, number>>({})

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
  const filtering = search.trim().length > 0 || veg !== "ALL" || arOnly

  const filtered = useMemo<Category[]>(() => {
    if (!data) return []
    const q = search.trim().toLowerCase()
    return data.categories
      .map((c) => ({
        ...c,
        items: c.items.filter((it) => {
          if (veg === "VEG" && !it.isVeg) return false
          if (veg === "NONVEG" && it.isVeg) return false
          if (arOnly && !it.model3dUrl) return false
          if (!q) return true
          return (
            it.name.toLowerCase().includes(q) ||
            (it.description ?? "").toLowerCase().includes(q) ||
            it.tags.some((t) => t.toLowerCase().includes(q))
          )
        }),
      }))
      .filter((c) => c.items.length > 0)
  }, [data, search, veg, arOnly])

  const popular = useMemo<MenuItem[]>(() => {
    if (!data || filtering) return []
    const tagged = data.categories
      .flatMap((c) => c.items)
      .filter((it) => it.tags.some((t) => POPULAR.test(t)))
    return tagged.slice(0, 8)
  }, [data, filtering])

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const y = e.nativeEvent.contentOffset.y + 140
    let current = filtered[0]?.id ?? ""
    for (const c of filtered) {
      if ((offsets.current[c.id] ?? Infinity) <= y) current = c.id
    }
    if (current !== activeCat) setActiveCat(current)
  }

  function jumpTo(id: string) {
    const y = offsets.current[id]
    if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true })
  }

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

      <View className="px-5 pb-2">
        <View className="flex-row items-center bg-surface rounded-2xl border border-line px-4">
          <Search size={18} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search dishes"
            placeholderTextColor={colors.muted}
            className="flex-1 h-12 text-ink font-sans-medium text-base ml-2"
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch("")} className="w-8 h-8 items-center justify-center">
              <X size={16} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>

        <View className="flex-row gap-2 mt-2">
          <FilterChip label="Veg" active={veg === "VEG"} onPress={() => setVeg(veg === "VEG" ? "ALL" : "VEG")} tint={colors.success} icon={<Leaf size={13} color={veg === "VEG" ? "#FFF7F3" : colors.success} />} />
          <FilterChip label="Non-veg" active={veg === "NONVEG"} onPress={() => setVeg(veg === "NONVEG" ? "ALL" : "NONVEG")} tint={colors.danger} />
          <FilterChip label="AR" active={arOnly} onPress={() => setArOnly(!arOnly)} tint={colors.accent} icon={<Box size={13} color={arOnly ? "#FFF7F3" : colors.accent} />} />
        </View>
      </View>

      {!filtering && filtered.length > 0 ? (
        <View className="pb-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {filtered.map((c) => {
              const on = activeCat === c.id
              return (
                <Pressable
                  key={c.id}
                  onPress={() => jumpTo(c.id)}
                  style={on ? { backgroundColor: brand } : undefined}
                  className={`px-4 py-2 rounded-full border ${on ? "" : "border-line bg-surface"}`}
                >
                  <Text className="text-sm font-sans-semibold" style={{ color: on ? colors.onPrimary : colors.muted }}>
                    {c.name}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>
        </View>
      ) : null}

      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={64}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View className="px-5 pt-2 pb-4">
          <Text variant="display" className="text-4xl leading-tight" style={{ color: brand }}>
            {data.restaurant.name}
          </Text>
          {data.restaurant.description ? (
            <Text variant="muted" className="text-base mt-2 leading-relaxed">
              {data.restaurant.description}
            </Text>
          ) : null}
        </View>

        {popular.length > 0 ? (
          <View className="mb-8">
            <Text variant="muted" className="text-xs uppercase tracking-widest px-5 mb-3">
              Popular right now
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
              {popular.map((item) => (
                <Pressable key={item.id} onPress={() => setSelected(item)} className="w-40">
                  <View className="w-40 h-28 rounded-2xl overflow-hidden bg-surface-elevated mb-2">
                    {item.imageUrl ? (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                    ) : null}
                  </View>
                  <Text variant="title" className="text-sm" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text variant="price" className="text-sm mt-0.5" style={{ color: brand }}>
                    ₹{Number(item.price)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {filtered.length === 0 ? (
          <View className="items-center py-24 px-8">
            <Text variant="title" className="text-lg mb-1">
              No dishes match
            </Text>
            <Text variant="muted" className="text-base text-center">
              Try a different search or clear the filters.
            </Text>
          </View>
        ) : null}

        {filtered.map((category) => (
          <View
            key={category.id}
            className="mb-8"
            onLayout={(e) => {
              offsets.current[category.id] = e.nativeEvent.layout.y
            }}
          >
            <Text variant="heading" className="text-2xl px-5 mb-4">
              {category.name}
            </Text>
            <View className="px-5 gap-3">
              {category.items.map((item) => (
                <Pressable key={item.id} onPress={() => setSelected(item)}>
                  <View className="flex-row h-36 bg-surface rounded-3xl border border-line overflow-hidden">
                    <View className="flex-1 p-4 justify-center">
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
                      <Text variant="title" className="text-base mb-1" numberOfLines={1}>
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
              <Text className="font-sans-bold text-base" style={{ color: colors.onPrimary }}>
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </Text>
            </View>
            <Text className="font-sans-bold text-base" style={{ color: colors.onPrimary }}>View cart · ₹{subtotal}</Text>
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
          usdzUrl={arItem.model3dUsdzUrl}
          posterUrl={arItem.model3dPosterUrl}
          itemName={arItem.name}
          onClose={() => setArItem(null)}
        />
      ) : null}
    </SafeAreaView>
  )
}

function FilterChip({
  label,
  active,
  onPress,
  tint,
  icon,
}: {
  label: string
  active: boolean
  onPress: () => void
  tint: string
  icon?: React.ReactNode
}) {
  const { colors } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      style={active ? { backgroundColor: tint } : undefined}
      className={`flex-row items-center gap-1.5 px-3.5 py-2 rounded-full border ${
        active ? "" : "border-line bg-surface"
      }`}
    >
      {icon}
      <Text className="text-sm font-sans-semibold" style={{ color: active ? colors.onPrimary : colors.ink }}>
        {label}
      </Text>
    </Pressable>
  )
}
