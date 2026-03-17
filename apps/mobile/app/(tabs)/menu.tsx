import { useState, useMemo, useCallback, useRef } from "react"
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TextInput,
  StyleSheet,
  RefreshControl,
} from "react-native"
import { useQuery } from "@tanstack/react-query"
import { SafeAreaView } from "react-native-safe-area-context"
import Animated, { FadeInDown } from "react-native-reanimated"
import { Ionicons } from "@expo/vector-icons"
import { colors, typography, spacing, radii } from "@/constants/theme"
import { useAuthStore } from "@/stores/auth"
import { useCartStore, CartItem } from "@/stores/cart"
import api from "@/lib/api"
import CategoryPill from "@/components/menu/CategoryPill"
import MenuItemCard from "@/components/menu/MenuItemCard"
import ItemDetailSheet from "@/components/menu/ItemDetailSheet"
import Skeleton from "@/components/ui/Skeleton"

export default function MenuScreen() {
  const canteen = useAuthStore((s) => s.canteen)
  const items = useCartStore((s) => s.items)
  const addItem = useCartStore((s) => s.addItem)
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const listRef = useRef<FlatList>(null)

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["menu", canteen?.canteenSlug],
    queryFn: async () => {
      const { data } = await api.get(
        `/api/v1/public/canteen/${canteen?.canteenSlug}/menu`
      )
      return data.data
    },
    enabled: !!canteen?.canteenSlug,
  })

  const categories = useMemo(() => {
    if (!data?.categories) return []
    return data.categories.filter(
      (c: any) => c.items && c.items.length > 0
    )
  }, [data])

  const filteredItems = useMemo(() => {
    let allItems: any[] = []
    categories.forEach((cat: any) => {
      if (activeCategory && cat.id !== activeCategory) return
      cat.items.forEach((item: any) => {
        allItems.push({ ...item, categoryName: cat.name, categoryId: cat.id })
      })
    })
    if (search.trim()) {
      const q = search.toLowerCase()
      allItems = allItems.filter((item) =>
        item.name.toLowerCase().includes(q)
      )
    }
    return allItems
  }, [categories, activeCategory, search])

  const getCartQuantity = useCallback(
    (menuItemId: string) =>
      items
        .filter((i) => i.menuItemId === menuItemId)
        .reduce((sum, i) => sum + i.quantity, 0),
    [items]
  )

  const handleQuickAdd = (item: any) => {
    const cartItem: CartItem = {
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      imageUrl: item.imageUrl,
      isVeg: item.isVeg,
      selectedOptions: [],
    }
    addItem(cartItem)
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={styles.skeletonInfo}>
                <Skeleton width={120} height={16} />
                <Skeleton width={200} height={12} />
                <Skeleton width={60} height={16} />
              </View>
              <Skeleton width={80} height={64} borderRadius={radii.lg} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text style={styles.canteenName}>{canteen?.canteenName}</Text>
        <Text style={styles.tableLabel}>Table {canteen?.tableLabel}</Text>
      </Animated.View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.neutral[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search menu..."
          placeholderTextColor={colors.neutral[400]}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Ionicons
            name="close-circle"
            size={18}
            color={colors.neutral[400]}
            onPress={() => setSearch("")}
          />
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryList}
        contentContainerStyle={styles.categoryContent}
      >
        {[{ id: null, name: "All" }, ...categories].map((item) => (
          <CategoryPill
            key={item.id || "all"}
            name={item.name}
            isActive={activeCategory === item.id}
            onPress={() =>
              setActiveCategory(item.id === activeCategory ? null : item.id)
            }
          />
        ))}
      </ScrollView>

      <FlatList
        ref={listRef}
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MenuItemCard
            item={item}
            onPress={() => setSelectedItem(item)}
            onQuickAdd={() => handleQuickAdd(item)}
            cartQuantity={getCartQuantity(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.red}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="restaurant-outline" size={48} color={colors.neutral[300]} />
            <Text style={styles.emptyText}>
              {search ? "No items found" : "No items available"}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {selectedItem && (
        <ItemDetailSheet
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  canteenName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extrabold,
    color: colors.black,
  },
  tableLabel: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[500],
    fontWeight: typography.weights.medium,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.neutral[50],
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.black,
  },
  categoryList: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: spacing.sm,
  },
  categoryContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  listContent: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing["5xl"],
    gap: spacing.md,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.neutral[400],
  },
  loadingContainer: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  skeletonCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skeletonInfo: {
    gap: spacing.sm,
  },
})
