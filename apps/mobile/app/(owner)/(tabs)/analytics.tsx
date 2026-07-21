import { useState } from "react"
import { View, ScrollView, Pressable, ActivityIndicator } from "react-native"
import { useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { SafeAreaView } from "react-native-safe-area-context"
import { Lock, ArrowUpRight } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { ownerApi, OwnerApiError } from "@/lib/owner-api"
import { useOwnerRestaurant } from "@/lib/use-owner-restaurant"
import { useTheme } from "@/theme/theme-provider"

interface Summary {
  totalOrders: number
  totalRevenue: number
  avgPrepTimeMinutes: number
  activeOrders: number
  todayOrders: number
  todayRevenue: number
}
interface RevenueDay {
  date: string
  revenue: number
  orders: number
}
interface PopularItem {
  name: string
  totalOrders: number
  revenue: number
}
interface CategoryRevenue {
  categoryName: string
  revenue: number
  orders: number
}
interface MenuViewsData {
  days: number
  totalViews: number
  uniqueVisitors: number
  orders: number
  conversionRate: number
  topItems: { menuItemId: string; name: string; views: number }[]
}

function money(v: string | number) {
  return `₹${Math.round(Number(v)).toLocaleString("en-IN")}`
}

function dayLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { weekday: "short" })
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-7">
      <Text variant="muted" className="text-xs tracking-widest uppercase mb-3 px-1">
        {title}
      </Text>
      {children}
    </View>
  )
}

export default function OwnerAnalytics() {
  const router = useRouter()
  const { colors } = useTheme()
  const { restaurant } = useOwnerRestaurant()
  const rid = restaurant?.id
  const [viewDays, setViewDays] = useState<7 | 30>(7)

  const { data: summary } = useQuery({
    queryKey: ["owner-summary", rid],
    queryFn: () => ownerApi.get<Summary>(`/api/v1/restaurants/${rid}/analytics/summary`),
    enabled: !!rid,
    refetchInterval: 60000,
  })

  const { data: revenue } = useQuery({
    queryKey: ["owner-an-revenue", rid],
    queryFn: () => ownerApi.get<RevenueDay[]>(`/api/v1/restaurants/${rid}/analytics/revenue?days=7`),
    enabled: !!rid,
  })

  const { data: popular } = useQuery({
    queryKey: ["owner-an-popular", rid],
    queryFn: () => ownerApi.get<PopularItem[]>(`/api/v1/restaurants/${rid}/analytics/popular-items`),
    enabled: !!rid,
  })

  const { data: catRevenue } = useQuery({
    queryKey: ["owner-an-category", rid],
    queryFn: () =>
      ownerApi.get<CategoryRevenue[]>(`/api/v1/restaurants/${rid}/analytics/category-revenue`),
    enabled: !!rid,
  })

  const { data: views, error: viewsError, isLoading: viewsLoading } = useQuery({
    queryKey: ["owner-an-views", rid, viewDays],
    queryFn: () =>
      ownerApi.get<MenuViewsData>(`/api/v1/restaurants/${rid}/analytics/views?days=${viewDays}`),
    enabled: !!rid,
    retry: false,
  })
  const viewsLocked = (viewsError as OwnerApiError)?.status === 402

  const revenueMax = Math.max(1, ...(revenue ?? []).map((d) => Number(d.revenue)))
  const catMax = Math.max(1, ...(catRevenue ?? []).map((c) => Number(c.revenue)))

  const KPIS = [
    { label: "Today's orders", value: summary ? String(summary.todayOrders) : "—" },
    { label: "Today's revenue", value: summary ? money(summary.todayRevenue) : "—" },
    { label: "Total orders", value: summary ? String(summary.totalOrders) : "—" },
    { label: "Total revenue", value: summary ? money(summary.totalRevenue) : "—" },
  ]

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <View className="px-5 pb-4">
        <Text variant="muted" className="text-xs tracking-widest uppercase">
          Analytics
        </Text>
        <Text variant="heading" className="text-2xl">
          {restaurant?.name ?? "Analytics"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4, paddingBottom: 40 }}>
        <View className="flex-row flex-wrap gap-2 mb-7">
          {KPIS.map((kpi) => (
            <View
              key={kpi.label}
              className="bg-surface rounded-2xl border border-line p-4"
              style={{ width: "48%" }}
            >
              <Text variant="muted" className="text-[11px] mb-1">
                {kpi.label}
              </Text>
              <Text variant="title" className="text-xl">
                {kpi.value}
              </Text>
            </View>
          ))}
        </View>

        <Section title="Revenue · last 7 days">
          <View className="bg-surface rounded-3xl border border-line p-5">
            {revenue && revenue.length > 0 ? (
              <View className="flex-row items-end justify-between gap-2" style={{ height: 150 }}>
                {revenue.map((d) => {
                  const h = Math.max(4, (Number(d.revenue) / revenueMax) * 120)
                  return (
                    <View key={d.date} className="flex-1 items-center">
                      <Text variant="muted" className="text-[10px] mb-1">
                        {Number(d.revenue) > 0 ? Math.round(Number(d.revenue) / 1000) + "k" : ""}
                      </Text>
                      <View style={{ height: h }} className="w-full rounded-t-lg bg-primary" />
                      <Text variant="muted" className="text-[10px] mt-1">
                        {dayLabel(d.date)}
                      </Text>
                    </View>
                  )
                })}
              </View>
            ) : (
              <Text variant="muted" className="text-sm">
                No revenue data yet.
              </Text>
            )}
          </View>
        </Section>

        <Section title="Most popular">
          <View className="bg-surface rounded-3xl border border-line overflow-hidden">
            {popular && popular.length > 0 ? (
              popular.slice(0, 6).map((item, i) => (
                <View
                  key={item.name + i}
                  className={`flex-row items-center justify-between px-4 py-3.5 ${
                    i > 0 ? "border-t border-line" : ""
                  }`}
                >
                  <View className="flex-row items-center gap-3 flex-1 pr-3">
                    <Text variant="heading" className="text-base text-accent">
                      {i + 1}
                    </Text>
                    <Text variant="title" className="text-base flex-1" numberOfLines={1}>
                      {item.name}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text variant="body" className="text-sm">
                      {item.totalOrders} sold
                    </Text>
                    <Text variant="price" className="text-sm">
                      {money(item.revenue)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text variant="muted" className="text-sm p-4">
                No sales yet.
              </Text>
            )}
          </View>
        </Section>

        {catRevenue && catRevenue.length > 0 ? (
          <Section title="Revenue by category">
            <View className="bg-surface rounded-3xl border border-line p-5 gap-3">
              {catRevenue.map((c) => (
                <View key={c.categoryName}>
                  <View className="flex-row justify-between mb-1">
                    <Text variant="body" className="text-sm">
                      {c.categoryName}
                    </Text>
                    <Text variant="price" className="text-sm">
                      {money(c.revenue)}
                    </Text>
                  </View>
                  <View className="h-2 rounded-full bg-canvas overflow-hidden">
                    <View
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${Math.max(3, (Number(c.revenue) / catMax) * 100)}%` }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        <Section title="Menu views">
          {viewsLocked ? (
            <Pressable
              onPress={() => router.push("/(owner)/billing")}
              className="bg-surface rounded-3xl border border-line p-6 items-center"
            >
              <View className="w-12 h-12 rounded-full bg-accent/15 items-center justify-center mb-3">
                <Lock size={22} color={colors.accent} />
              </View>
              <Text variant="title" className="text-base mb-1">
                Unlock menu-view insights
              </Text>
              <Text variant="muted" className="text-sm text-center mb-4">
                See views, unique visitors and view-to-order conversion on a paid plan.
              </Text>
              <View className="flex-row items-center gap-1">
                <Text variant="label" className="text-sm text-accent">
                  View plans
                </Text>
                <ArrowUpRight size={16} color={colors.accent} />
              </View>
            </Pressable>
          ) : (
            <View className="bg-surface rounded-3xl border border-line p-5">
              <View className="flex-row justify-end mb-4">
                <View className="flex-row bg-canvas rounded-full border border-line p-0.5">
                  {([7, 30] as const).map((d) => (
                    <Pressable
                      key={d}
                      onPress={() => setViewDays(d)}
                      className={`px-3 py-1 rounded-full ${viewDays === d ? "bg-primary" : ""}`}
                    >
                      <Text
                        variant="label"
                        className={`text-xs ${viewDays === d ? "text-[#FFF7F3]" : "text-muted"}`}
                      >
                        {d}d
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {viewsLoading ? (
                <ActivityIndicator color={colors.primary} />
              ) : views ? (
                <>
                  <View className="flex-row gap-2 mb-4">
                    <View className="flex-1">
                      <Text variant="title" className="text-2xl">
                        {views.totalViews}
                      </Text>
                      <Text variant="muted" className="text-xs">
                        Views
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text variant="title" className="text-2xl">
                        {views.uniqueVisitors}
                      </Text>
                      <Text variant="muted" className="text-xs">
                        Visitors
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text variant="title" className="text-2xl">
                        {Math.round(views.conversionRate)}%
                      </Text>
                      <Text variant="muted" className="text-xs">
                        Convert
                      </Text>
                    </View>
                  </View>
                  {views.topItems?.slice(0, 5).map((t) => (
                    <View key={t.menuItemId} className="flex-row justify-between py-1.5">
                      <Text variant="body" className="text-sm flex-1" numberOfLines={1}>
                        {t.name}
                      </Text>
                      <Text variant="muted" className="text-sm">
                        {t.views} views
                      </Text>
                    </View>
                  ))}
                </>
              ) : (
                <Text variant="muted" className="text-sm">
                  No view data yet.
                </Text>
              )}
            </View>
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  )
}
