"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import {
  ShoppingBag,
  DollarSign,
  Clock,
  TrendingUp,
  BarChart3,
  Eye,
  Users,
  Percent,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import api from "@/lib/api"
import { formatPrice } from "@/lib/utils"

interface AnalyticsSummary {
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

interface PeakHour {
  hour: number
  orders: number
}

interface CategoryRevenue {
  categoryName: string
  revenue: number
  orders: number
}

interface MenuViewsTimelineDay {
  date: string
  views: number
  visitors: number
}

interface MenuViewsTopItem {
  menuItemId: string
  name: string
  imageUrl?: string | null
  views: number
}

interface MenuViewsData {
  days: number
  totalViews: number
  uniqueVisitors: number
  orders: number
  conversionRate: number
  timeline: MenuViewsTimelineDay[]
  topItems: MenuViewsTopItem[]
}

function formatDayLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
  })
}

export default function AnalyticsPage() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null)

  const { data: restaurants } = useQuery({
    queryKey: ["restaurants"],
    queryFn: () => api.get("/api/v1/restaurants").then((r) => r.data.data),
  })

  useEffect(() => {
    if (restaurants?.[0] && !restaurantId) {
      setRestaurantId(restaurants[0].id)
    }
  }, [restaurants, restaurantId])

  const { data: summary } = useQuery<AnalyticsSummary>({
    queryKey: ["analytics-summary", restaurantId],
    queryFn: () =>
      api.get(`/api/v1/restaurants/${restaurantId}/analytics/summary`).then((r) => r.data.data),
    enabled: !!restaurantId,
    refetchInterval: 60000,
  })

  const { data: revenueData } = useQuery<RevenueDay[]>({
    queryKey: ["analytics-revenue", restaurantId],
    queryFn: () =>
      api.get(`/api/v1/restaurants/${restaurantId}/analytics/revenue?days=7`).then((r) => r.data.data),
    enabled: !!restaurantId,
  })

  const { data: popularItems } = useQuery<PopularItem[]>({
    queryKey: ["analytics-popular", restaurantId],
    queryFn: () =>
      api.get(`/api/v1/restaurants/${restaurantId}/analytics/popular-items`).then((r) => r.data.data),
    enabled: !!restaurantId,
  })

  const { data: peakHours } = useQuery<PeakHour[]>({
    queryKey: ["analytics-peak-hours", restaurantId],
    queryFn: () =>
      api.get(`/api/v1/restaurants/${restaurantId}/analytics/peak-hours`).then((r) => r.data.data),
    enabled: !!restaurantId,
  })

  const { data: categoryRevenue } = useQuery<CategoryRevenue[]>({
    queryKey: ["analytics-category-revenue", restaurantId],
    queryFn: () =>
      api.get(`/api/v1/restaurants/${restaurantId}/analytics/category-revenue`).then((r) => r.data.data),
    enabled: !!restaurantId,
  })

  const [menuViewsDays, setMenuViewsDays] = useState<7 | 30>(7)

  const {
    data: menuViews,
    error: menuViewsError,
    isLoading: menuViewsLoading,
  } = useQuery<MenuViewsData>({
    queryKey: ["analytics-menu-views", restaurantId, menuViewsDays],
    queryFn: () =>
      api
        .get(`/api/v1/restaurants/${restaurantId}/analytics/views?days=${menuViewsDays}`)
        .then((r) => r.data.data),
    enabled: !!restaurantId,
    retry: false,
  })

  const menuViewsUpsell = (menuViewsError as any)?.response?.status === 402
  const menuViewsUpsellMessage =
    (menuViewsError as any)?.response?.data?.error ??
    "Upgrade your plan to unlock menu view analytics."

  const summaryCards = [
    {
      label: "Total Orders",
      value: summary?.totalOrders ?? 0,
      sub: `${summary?.todayOrders ?? 0} orders today`,
      icon: ShoppingBag,
      iconBg: "bg-primary/10",
      iconColor: "text-brand-red",
    },
    {
      label: "Total Revenue",
      value: formatPrice(summary?.totalRevenue ?? 0),
      sub: `${formatPrice(summary?.todayRevenue ?? 0)} today`,
      icon: DollarSign,
      iconBg: "bg-surface-elevated",
      iconColor: "text-ink",
    },
    {
      label: "Avg Prep Time",
      value: `${summary?.avgPrepTimeMinutes ?? 0} min`,
      sub: "Average across all orders",
      icon: Clock,
      iconBg: "bg-surface-elevated",
      iconColor: "text-ink",
    },
    {
      label: "Active Orders Now",
      value: summary?.activeOrders ?? 0,
      sub: "Currently in the kitchen",
      icon: TrendingUp,
      iconBg: "bg-surface-elevated",
      iconColor: "text-ink",
    },
  ]

  const maxRevenue = Math.max(...(revenueData?.map((d) => d.revenue) ?? [1]))
  const maxItemOrders = Math.max(...(popularItems?.map((i) => i.totalOrders) ?? [1]))
  const maxCategoryRevenue = Math.max(...(categoryRevenue?.map((c) => c.revenue) ?? [1]))
  const maxHourOrders = Math.max(...(peakHours?.map((h) => h.orders) ?? [1]))
  const maxDailyViews = Math.max(...(menuViews?.timeline.map((d) => d.views) ?? [1]))
  const maxTopItemViews = Math.max(...(menuViews?.topItems.map((i) => i.views) ?? [1]))

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-brand-red" />
            </div>
            <h1 className="text-3xl font-extrabold text-ink">Analytics</h1>
          </div>
          <p className="text-muted">Performance overview for your restaurant</p>
        </div>

        {restaurants && restaurants.length > 1 && (
          <select
            value={restaurantId || ""}
            onChange={(e) => setRestaurantId(e.target.value)}
            className="px-4 py-3 rounded-xl border border-line text-sm focus:outline-none focus:border-brand-red"
          >
            {restaurants.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
              <Card>
                <CardContent className="py-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${card.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-7 h-7 ${card.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted">{card.label}</p>
                      <p className="text-3xl font-extrabold text-ink leading-tight mt-0.5">
                        {card.value}
                      </p>
                      <p className="text-xs text-muted mt-0.5">{card.sub}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold text-ink">Revenue — Last 7 Days</h2>
              <p className="text-sm text-muted">Daily earnings breakdown</p>
            </CardHeader>
            <CardContent>
              {!revenueData && (
                <div className="h-48 flex items-center justify-center">
                  <div className="animate-spin w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full" />
                </div>
              )}
              {revenueData && revenueData.length === 0 && (
                <div className="h-48 flex flex-col items-center justify-center">
                  <BarChart3 className="w-12 h-12 text-muted/30 mb-3" />
                  <p className="text-muted text-sm font-medium">No revenue data yet</p>
                </div>
              )}
              {revenueData && revenueData.length > 0 && (
                <div className="flex items-end gap-3 h-48 mt-2">
                  {revenueData.map((day, idx) => {
                    const heightPct = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0
                    return (
                      <motion.div
                        key={day.date}
                        initial={{ height: 0 }}
                        animate={{ height: "100%" }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex-1 flex flex-col items-center justify-end gap-1"
                      >
                        <span className="text-xs font-bold text-muted truncate w-full text-center">
                          {formatPrice(day.revenue)}
                        </span>
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ delay: idx * 0.05, type: "spring", stiffness: 200, damping: 20 }}
                          style={{ height: `${Math.max(heightPct, 4)}%`, transformOrigin: "bottom" }}
                          className="w-full bg-brand-red rounded-t-lg"
                        />
                        <span className="text-xs text-muted text-center leading-tight">
                          {formatDayLabel(day.date)}
                        </span>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold text-ink">Most Popular Items</h2>
              <p className="text-sm text-muted">Best selling items by order count</p>
            </CardHeader>
            <CardContent>
              {!popularItems && (
                <div className="h-48 flex items-center justify-center">
                  <div className="animate-spin w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full" />
                </div>
              )}
              {popularItems && popularItems.length === 0 && (
                <div className="h-48 flex flex-col items-center justify-center">
                  <ShoppingBag className="w-12 h-12 text-muted/30 mb-3" />
                  <p className="text-muted text-sm font-medium">No orders yet</p>
                </div>
              )}
              {popularItems && popularItems.length > 0 && (
                <div className="space-y-4 mt-1">
                  {popularItems.slice(0, 6).map((item, idx) => {
                    const widthPct = maxItemOrders > 0 ? (item.totalOrders / maxItemOrders) * 100 : 0
                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-muted w-5">
                              {idx + 1}
                            </span>
                            <span className="text-sm font-bold text-ink truncate max-w-[160px]">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-muted">
                            {item.totalOrders} orders
                          </span>
                        </div>
                        <div className="h-2.5 bg-surface-elevated rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${widthPct}%` }}
                            transition={{ delay: idx * 0.05, type: "spring", stiffness: 150 }}
                            className="h-full bg-brand-red rounded-full"
                          />
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold text-ink">Peak Hours</h2>
              <p className="text-sm text-muted">Busiest hours of the day — darker means more orders</p>
            </CardHeader>
            <CardContent>
              {!peakHours && (
                <div className="h-40 flex items-center justify-center">
                  <div className="animate-spin w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full" />
                </div>
              )}
              {peakHours && peakHours.length === 0 && (
                <div className="h-40 flex flex-col items-center justify-center">
                  <Clock className="w-12 h-12 text-muted/30 mb-3" />
                  <p className="text-muted text-sm font-medium">No data yet</p>
                </div>
              )}
              {peakHours && peakHours.length > 0 && (
                <>
                  <div className="grid grid-cols-6 gap-1.5 mt-2">
                    {Array.from({ length: 24 }, (_, hour) => {
                      const hourData = peakHours.find((h) => h.hour === hour)
                      const orders = hourData?.orders ?? 0
                      const intensity = maxHourOrders > 0 ? orders / maxHourOrders : 0
                      const opacity = intensity > 0 ? Math.max(0.15, intensity) : 0.05
                      const isBusy = intensity > 0.6

                      return (
                        <motion.div
                          key={hour}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: hour * 0.015 }}
                          title={`${hour}:00 — ${orders} orders`}
                          className="aspect-square rounded-xl flex items-center justify-center cursor-default"
                          style={{ backgroundColor: `rgba(220, 38, 38, ${opacity})` }}
                        >
                          <span className={`text-xs font-bold ${isBusy ? "text-brand-red" : "text-muted"}`}>
                            {hour}
                          </span>
                        </motion.div>
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted mt-3 text-center">
                    Numbers = hour (0–23). Hover over a cell to see order count.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold text-ink">Revenue by Category</h2>
              <p className="text-sm text-muted">Which categories earn the most</p>
            </CardHeader>
            <CardContent>
              {!categoryRevenue && (
                <div className="h-40 flex items-center justify-center">
                  <div className="animate-spin w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full" />
                </div>
              )}
              {categoryRevenue && categoryRevenue.length === 0 && (
                <div className="h-40 flex flex-col items-center justify-center">
                  <BarChart3 className="w-12 h-12 text-muted/30 mb-3" />
                  <p className="text-muted text-sm font-medium">No data yet</p>
                </div>
              )}
              {categoryRevenue && categoryRevenue.length > 0 && (
                <div className="space-y-4 mt-1">
                  {categoryRevenue.map((cat, idx) => {
                    const widthPct = maxCategoryRevenue > 0 ? (cat.revenue / maxCategoryRevenue) * 100 : 0
                    return (
                      <motion.div
                        key={cat.categoryName}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.06 }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-bold text-ink truncate max-w-[180px]">
                            {cat.categoryName}
                          </span>
                          <div className="text-right">
                            <span className="text-sm font-extrabold text-ink">
                              {formatPrice(cat.revenue)}
                            </span>
                            <span className="text-xs text-muted ml-2">
                              {cat.orders} orders
                            </span>
                          </div>
                        </div>
                        <div className="h-3 bg-surface-elevated rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${widthPct}%` }}
                            transition={{ delay: idx * 0.06, type: "spring", stiffness: 150 }}
                            className="h-full bg-ink rounded-full"
                          />
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="flex items-center justify-between mb-4"
        >
          <div>
            <h2 className="text-xl font-bold text-ink">Menu Views</h2>
            <p className="text-sm text-muted">How customers are browsing your menu</p>
          </div>
          {!menuViewsUpsell && (
            <div className="flex items-center gap-1 bg-surface-elevated rounded-xl p-1">
              {([7, 30] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setMenuViewsDays(d)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    menuViewsDays === d
                      ? "bg-surface text-ink shadow-sm"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {menuViewsUpsell ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardContent className="py-12 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Eye className="w-7 h-7 text-brand-red" />
                </div>
                <p className="text-muted font-medium max-w-md mb-5">{menuViewsUpsellMessage}</p>
                <Link
                  href="/admin/billing"
                  className="px-6 py-3 rounded-xl bg-brand-red text-white text-sm font-bold hover:bg-primary-hover transition-colors"
                >
                  View plans
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                {
                  label: "Total Views",
                  value: menuViews?.totalViews ?? 0,
                  sub: `Last ${menuViewsDays} days`,
                  icon: Eye,
                },
                {
                  label: "Unique Visitors",
                  value: menuViews?.uniqueVisitors ?? 0,
                  sub: `Last ${menuViewsDays} days`,
                  icon: Users,
                },
                {
                  label: "View-to-Order Conversion",
                  value: `${menuViews?.conversionRate ?? 0}%`,
                  sub: `${menuViews?.orders ?? 0} orders from views`,
                  icon: Percent,
                },
              ].map((card, idx) => {
                const Icon = card.icon
                return (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + idx * 0.08 }}
                  >
                    <Card>
                      <CardContent className="py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-7 h-7 text-brand-red" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted">{card.label}</p>
                            <p className="text-3xl font-extrabold text-ink leading-tight mt-0.5">
                              {card.value}
                            </p>
                            <p className="text-xs text-muted mt-0.5">{card.sub}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85 }}
              >
                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-bold text-ink">
                      Menu Views — Last {menuViewsDays} Days
                    </h2>
                    <p className="text-sm text-muted">Daily views breakdown</p>
                  </CardHeader>
                  <CardContent>
                    {menuViewsLoading && (
                      <div className="h-48 flex items-center justify-center">
                        <div className="animate-spin w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full" />
                      </div>
                    )}
                    {!menuViewsLoading && menuViews && menuViews.timeline.length === 0 && (
                      <div className="h-48 flex flex-col items-center justify-center">
                        <Eye className="w-12 h-12 text-muted/30 mb-3" />
                        <p className="text-muted text-sm font-medium">No menu views recorded yet</p>
                      </div>
                    )}
                    {!menuViewsLoading && menuViews && menuViews.timeline.length > 0 && (
                      <div className="flex items-end gap-3 h-48 mt-2 overflow-x-auto">
                        {menuViews.timeline.map((day, idx) => {
                          const heightPct = maxDailyViews > 0 ? (day.views / maxDailyViews) * 100 : 0
                          return (
                            <motion.div
                              key={day.date}
                              initial={{ height: 0 }}
                              animate={{ height: "100%" }}
                              transition={{ delay: idx * 0.05 }}
                              className="flex-1 flex flex-col items-center justify-end gap-1 min-w-[28px]"
                            >
                              <span className="text-xs font-bold text-muted truncate w-full text-center">
                                {day.views}
                              </span>
                              <motion.div
                                initial={{ scaleY: 0 }}
                                animate={{ scaleY: 1 }}
                                transition={{ delay: idx * 0.05, type: "spring", stiffness: 200, damping: 20 }}
                                style={{ height: `${Math.max(heightPct, 4)}%`, transformOrigin: "bottom" }}
                                className="w-full bg-brand-red rounded-t-lg"
                              />
                              <span className="text-xs text-muted text-center leading-tight">
                                {formatDayLabel(day.date)}
                              </span>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-bold text-ink">Most Viewed Items</h2>
                    <p className="text-sm text-muted">Menu items customers look at the most</p>
                  </CardHeader>
                  <CardContent>
                    {menuViewsLoading && (
                      <div className="h-48 flex items-center justify-center">
                        <div className="animate-spin w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full" />
                      </div>
                    )}
                    {!menuViewsLoading && menuViews && menuViews.topItems.length === 0 && (
                      <div className="h-48 flex flex-col items-center justify-center">
                        <Eye className="w-12 h-12 text-muted/30 mb-3" />
                        <p className="text-muted text-sm font-medium">No menu views recorded yet</p>
                      </div>
                    )}
                    {!menuViewsLoading && menuViews && menuViews.topItems.length > 0 && (
                      <div className="space-y-4 mt-1">
                        {menuViews.topItems.slice(0, 6).map((item, idx) => {
                          const widthPct = maxTopItemViews > 0 ? (item.views / maxTopItemViews) * 100 : 0
                          return (
                            <motion.div
                              key={item.menuItemId}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-sm font-extrabold text-muted w-5 flex-shrink-0">
                                    {idx + 1}
                                  </span>
                                  {item.imageUrl && (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.name}
                                      className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                                    />
                                  )}
                                  <span className="text-sm font-bold text-ink truncate max-w-[160px]">
                                    {item.name}
                                  </span>
                                </div>
                                <span className="text-sm font-semibold text-muted flex-shrink-0">
                                  {item.views} views
                                </span>
                              </div>
                              <div className="h-2.5 bg-surface-elevated rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${widthPct}%` }}
                                  transition={{ delay: idx * 0.05, type: "spring", stiffness: 150 }}
                                  className="h-full bg-brand-red rounded-full"
                                />
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
