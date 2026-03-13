"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import {
  ShoppingBag,
  DollarSign,
  Clock,
  TrendingUp,
  BarChart3,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useAuthStore } from "@/stores/auth"
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

function formatDayLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
  })
}

export default function AnalyticsPage() {
  const [canteenId, setCanteenId] = useState<string | null>(null)

  const { data: canteens } = useQuery({
    queryKey: ["canteens"],
    queryFn: () => api.get("/api/v1/canteens").then((r) => r.data.data),
  })

  useEffect(() => {
    if (canteens?.[0] && !canteenId) {
      setCanteenId(canteens[0].id)
    }
  }, [canteens, canteenId])

  const { data: summary } = useQuery<AnalyticsSummary>({
    queryKey: ["analytics-summary", canteenId],
    queryFn: () =>
      api
        .get(`/api/v1/canteens/${canteenId}/analytics/summary`)
        .then((r) => r.data.data),
    enabled: !!canteenId,
    refetchInterval: 60000,
  })

  const { data: revenueData } = useQuery<RevenueDay[]>({
    queryKey: ["analytics-revenue", canteenId],
    queryFn: () =>
      api
        .get(`/api/v1/canteens/${canteenId}/analytics/revenue?days=7`)
        .then((r) => r.data.data),
    enabled: !!canteenId,
  })

  const { data: popularItems } = useQuery<PopularItem[]>({
    queryKey: ["analytics-popular", canteenId],
    queryFn: () =>
      api
        .get(`/api/v1/canteens/${canteenId}/analytics/popular-items`)
        .then((r) => r.data.data),
    enabled: !!canteenId,
  })

  const { data: peakHours } = useQuery<PeakHour[]>({
    queryKey: ["analytics-peak-hours", canteenId],
    queryFn: () =>
      api
        .get(`/api/v1/canteens/${canteenId}/analytics/peak-hours`)
        .then((r) => r.data.data),
    enabled: !!canteenId,
  })

  const { data: categoryRevenue } = useQuery<CategoryRevenue[]>({
    queryKey: ["analytics-category-revenue", canteenId],
    queryFn: () =>
      api
        .get(`/api/v1/canteens/${canteenId}/analytics/category-revenue`)
        .then((r) => r.data.data),
    enabled: !!canteenId,
  })

  const summaryCards = [
    {
      label: "Total Orders",
      value: summary?.totalOrders ?? 0,
      sub: `${summary?.todayOrders ?? 0} today`,
      icon: ShoppingBag,
      iconBg: "bg-red-50",
      iconColor: "text-brand-red",
    },
    {
      label: "Total Revenue",
      value: formatPrice(summary?.totalRevenue ?? 0),
      sub: `${formatPrice(summary?.todayRevenue ?? 0)} today`,
      icon: DollarSign,
      iconBg: "bg-neutral-100",
      iconColor: "text-brand-black",
    },
    {
      label: "Avg Prep Time",
      value: `${summary?.avgPrepTimeMinutes ?? 0} min`,
      sub: "across all orders",
      icon: Clock,
      iconBg: "bg-neutral-100",
      iconColor: "text-brand-black",
    },
    {
      label: "Active Orders",
      value: summary?.activeOrders ?? 0,
      sub: "right now",
      icon: TrendingUp,
      iconBg: "bg-neutral-100",
      iconColor: "text-brand-black",
    },
  ]

  const maxRevenue = Math.max(...(revenueData?.map((d) => d.revenue) ?? [1]))
  const maxItemOrders = Math.max(
    ...(popularItems?.map((i) => i.totalOrders) ?? [1])
  )
  const maxCategoryRevenue = Math.max(
    ...(categoryRevenue?.map((c) => c.revenue) ?? [1])
  )
  const maxHourOrders = Math.max(
    ...(peakHours?.map((h) => h.orders) ?? [1])
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-black">Analytics</h1>
          <p className="text-neutral-500 mt-1">Performance overview for your canteen</p>
        </div>

        {canteens && canteens.length > 1 && (
          <select
            value={canteenId || ""}
            onChange={(e) => setCanteenId(e.target.value)}
            className="px-4 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-brand-red"
          >
            {canteens.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
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
                <CardContent className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">{card.label}</p>
                    <p className="text-2xl font-extrabold text-brand-black leading-tight">
                      {card.value}
                    </p>
                    <p className="text-xs text-neutral-400">{card.sub}</p>
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
              <h2 className="font-bold text-brand-black">Revenue — Last 7 Days</h2>
            </CardHeader>
            <CardContent>
              {!revenueData && (
                <div className="h-40 flex items-center justify-center">
                  <div className="animate-spin w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full" />
                </div>
              )}
              {revenueData && revenueData.length === 0 && (
                <p className="text-neutral-400 text-sm text-center py-10">
                  No revenue data available
                </p>
              )}
              {revenueData && revenueData.length > 0 && (
                <div className="flex items-end gap-3 h-40 mt-2">
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
                        <span className="text-xs font-semibold text-neutral-600 truncate w-full text-center">
                          {formatPrice(day.revenue)}
                        </span>
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{
                            delay: idx * 0.05,
                            type: "spring",
                            stiffness: 200,
                            damping: 20,
                          }}
                          style={{
                            height: `${Math.max(heightPct, 4)}%`,
                            transformOrigin: "bottom",
                          }}
                          className="w-full bg-brand-red rounded-t-lg"
                        />
                        <span className="text-xs text-neutral-400 text-center leading-tight">
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
              <h2 className="font-bold text-brand-black">Popular Items</h2>
            </CardHeader>
            <CardContent>
              {!popularItems && (
                <div className="h-40 flex items-center justify-center">
                  <div className="animate-spin w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full" />
                </div>
              )}
              {popularItems && popularItems.length === 0 && (
                <p className="text-neutral-400 text-sm text-center py-10">
                  No data available
                </p>
              )}
              {popularItems && popularItems.length > 0 && (
                <div className="space-y-3 mt-1">
                  {popularItems.slice(0, 6).map((item, idx) => {
                    const widthPct =
                      maxItemOrders > 0
                        ? (item.totalOrders / maxItemOrders) * 100
                        : 0
                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-400 w-4">
                              {idx + 1}
                            </span>
                            <span className="text-sm font-medium text-brand-black truncate max-w-[160px]">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-xs text-neutral-500">
                            {item.totalOrders} orders
                          </span>
                        </div>
                        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${widthPct}%` }}
                            transition={{
                              delay: idx * 0.05,
                              type: "spring",
                              stiffness: 150,
                            }}
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
              <h2 className="font-bold text-brand-black">Peak Hours</h2>
            </CardHeader>
            <CardContent>
              {!peakHours && (
                <div className="h-40 flex items-center justify-center">
                  <div className="animate-spin w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full" />
                </div>
              )}
              {peakHours && peakHours.length === 0 && (
                <p className="text-neutral-400 text-sm text-center py-10">
                  No data available
                </p>
              )}
              {peakHours && peakHours.length > 0 && (
                <div className="grid grid-cols-6 gap-1 mt-2">
                  {Array.from({ length: 24 }, (_, hour) => {
                    const hourData = peakHours.find((h) => h.hour === hour)
                    const orders = hourData?.orders ?? 0
                    const intensity =
                      maxHourOrders > 0 ? orders / maxHourOrders : 0
                    const opacity = intensity > 0 ? Math.max(0.15, intensity) : 0.05
                    const isBusy = intensity > 0.6

                    return (
                      <motion.div
                        key={hour}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: hour * 0.015 }}
                        title={`${hour}:00 — ${orders} orders`}
                        className="aspect-square rounded-lg flex items-center justify-center cursor-default"
                        style={{
                          backgroundColor: `rgba(220, 38, 38, ${opacity})`,
                        }}
                      >
                        <span
                          className={`text-xs font-semibold ${
                            isBusy ? "text-brand-red" : "text-neutral-400"
                          }`}
                        >
                          {hour}
                        </span>
                      </motion.div>
                    )
                  })}
                </div>
              )}
              <p className="text-xs text-neutral-400 mt-3 text-center">
                Darker = more orders. Hover for details.
              </p>
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
              <h2 className="font-bold text-brand-black">Revenue by Category</h2>
            </CardHeader>
            <CardContent>
              {!categoryRevenue && (
                <div className="h-40 flex items-center justify-center">
                  <div className="animate-spin w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full" />
                </div>
              )}
              {categoryRevenue && categoryRevenue.length === 0 && (
                <p className="text-neutral-400 text-sm text-center py-10">
                  No data available
                </p>
              )}
              {categoryRevenue && categoryRevenue.length > 0 && (
                <div className="space-y-3 mt-1">
                  {categoryRevenue.map((cat, idx) => {
                    const widthPct =
                      maxCategoryRevenue > 0
                        ? (cat.revenue / maxCategoryRevenue) * 100
                        : 0
                    return (
                      <motion.div
                        key={cat.categoryName}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.06 }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-brand-black truncate max-w-[180px]">
                            {cat.categoryName}
                          </span>
                          <div className="text-right">
                            <span className="text-sm font-bold text-brand-black">
                              {formatPrice(cat.revenue)}
                            </span>
                            <span className="text-xs text-neutral-400 ml-2">
                              {cat.orders} orders
                            </span>
                          </div>
                        </div>
                        <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${widthPct}%` }}
                            transition={{
                              delay: idx * 0.06,
                              type: "spring",
                              stiffness: 150,
                            }}
                            className="h-full bg-brand-black rounded-full"
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
    </div>
  )
}
