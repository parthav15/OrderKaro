"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Shield,
  Users,
  Store,
  CheckCircle2,
  XCircle,
  Search,
  ShoppingBag,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Coins,
  Landmark,
  MessageSquareText,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/stores/auth"
import api from "@/lib/api"
import { toast } from "sonner"
import { formatPrice } from "@/lib/utils"
import { PlatformRevenueCard } from "@/components/admin/platform-revenue-card"

interface OwnerRestaurant {
  id: string
  name: string
  slug: string
  isActive: boolean
}

interface Owner {
  id: string
  name: string
  email: string
  phone: string
  isVerified: boolean
  createdAt: string
  restaurants: OwnerRestaurant[]
}

interface SystemStats {
  totalOwners: number
  totalRestaurants: number
  activeRestaurants: number
  totalOrders: number
  totalRevenue: number
  platformRevenue: number
  marketplaceRestaurants: number
}

export default function SuperAdminPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [expandedOwnerId, setExpandedOwnerId] = useState<string | null>(null)

  const isSuperAdmin = Boolean(user?.isSuperAdmin)

  const { data: stats, isLoading: statsLoading } = useQuery<SystemStats>({
    queryKey: ["super-admin-stats"],
    queryFn: () =>
      api.get("/api/v1/admin/stats").then((r) => r.data.data),
    enabled: isSuperAdmin,
  })

  const { data: owners, isLoading: ownersLoading } = useQuery<Owner[]>({
    queryKey: ["super-admin-owners"],
    queryFn: () =>
      api.get("/api/v1/admin/owners").then((r) => r.data.data),
    enabled: isSuperAdmin,
  })

  const toggleVerification = useMutation({
    mutationFn: (ownerId: string) =>
      api.patch(`/api/v1/admin/owners/${ownerId}/verify`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-owners"] })
      queryClient.invalidateQueries({ queryKey: ["super-admin-stats"] })
      toast.success("Verification status updated")
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Failed to update verification"),
  })

  const filteredOwners = (owners ?? []).filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase())
  )

  if (!isSuperAdmin) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-32"
      >
        <Shield className="w-16 h-16 text-muted/30 mb-4" />
        <h2 className="text-xl font-bold text-ink">Access Denied</h2>
        <p className="text-muted mt-2 text-sm">
          This area is restricted to the super admin only.
        </p>
      </motion.div>
    )
  }

  const summaryStats = [
    {
      label: "Total Owners",
      value: stats?.totalOwners ?? 0,
      icon: Users,
      bg: "bg-primary/10",
      color: "text-brand-red",
    },
    {
      label: "Total Restaurants",
      value: stats?.totalRestaurants ?? 0,
      icon: Store,
      bg: "bg-surface-elevated",
      color: "text-ink",
    },
    {
      label: "Active Restaurants",
      value: stats?.activeRestaurants ?? 0,
      icon: CheckCircle2,
      bg: "bg-surface-elevated",
      color: "text-ink",
    },
    {
      label: "Marketplace Restaurants",
      value: stats?.marketplaceRestaurants ?? 0,
      icon: Landmark,
      bg: "bg-surface-elevated",
      color: "text-ink",
    },
    {
      label: "Total Orders",
      value: stats?.totalOrders ?? 0,
      icon: ShoppingBag,
      bg: "bg-surface-elevated",
      color: "text-ink",
    },
    {
      label: "Gross Order Value (GMV)",
      value: formatPrice(stats?.totalRevenue ?? 0),
      icon: TrendingUp,
      bg: "bg-surface-elevated",
      color: "text-ink",
    },
  ]

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <Shield className="w-6 h-6 text-brand-red" />
          <h1 className="text-2xl font-extrabold text-ink">
            Platform Overview
          </h1>
        </div>
        <p className="text-muted text-sm">
          Restaurants, revenue &amp; approvals across the platform
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-8"
      >
        <PlatformRevenueCard value={stats?.platformRevenue ?? 0} loading={statsLoading} />
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <Link href="/admin/fees">
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              className="group flex items-center justify-between gap-4 rounded-xl bg-surface border border-line shadow-sm px-6 py-5 transition-colors hover:border-primary/30"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Coins className="w-5 h-5 text-brand-red" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-ink text-sm">Marketplace Fees</p>
                  <p className="text-xs text-muted">
                    Configure platform delivery &amp; convenience fees
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted group-hover:text-brand-red group-hover:translate-x-0.5 transition-all shrink-0" />
            </motion.div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
        >
          <Link href="/admin/sms">
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              className="group flex items-center justify-between gap-4 rounded-xl bg-surface border border-line shadow-sm px-6 py-5 transition-colors hover:border-primary/30"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageSquareText className="w-5 h-5 text-brand-red" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-ink text-sm">SMS Notifications</p>
                  <p className="text-xs text-muted">
                    Set base cost, margins &amp; per-restaurant SMS access
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted group-hover:text-brand-red group-hover:translate-x-0.5 transition-all shrink-0" />
            </motion.div>
          </Link>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {summaryStats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.07 }}
            >
              <Card>
                <CardContent className="flex items-center gap-3 py-4">
                  <div
                    className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted leading-snug">
                      {stat.label}
                    </p>
                    <p className="text-xl font-extrabold text-ink leading-tight">
                      {statsLoading ? (
                        <span className="inline-block w-10 h-5 bg-surface-elevated animate-pulse rounded" />
                      ) : (
                        stat.value
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-ink">All Owners</h2>
          <div className="w-72">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-line bg-surface text-sm text-ink placeholder:text-muted focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-colors"
              />
            </div>
          </div>
        </div>

        {ownersLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-surface-elevated animate-pulse"
              />
            ))}
          </div>
        )}

        {!ownersLoading && filteredOwners.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 border border-dashed border-line rounded-2xl"
          >
            <Users className="w-12 h-12 text-muted/30 mx-auto mb-3" />
            <p className="text-muted font-medium">
              {search ? "No owners match your search" : "No owners registered yet"}
            </p>
          </motion.div>
        )}

        {!ownersLoading && filteredOwners.length > 0 && (
          <AnimatePresence>
            <div className="space-y-3">
              {filteredOwners.map((owner, idx) => (
                <motion.div
                  key={owner.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Card>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-11 h-11 rounded-full bg-brand-red/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-brand-red font-bold text-base">
                              {owner.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-ink text-sm">
                                {owner.name}
                              </p>
                              <Badge
                                variant={owner.isVerified ? "success" : "warning"}
                              >
                                {owner.isVerified ? "Account verified" : "Account unverified"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted truncate">
                              {owner.email}
                            </p>
                            <p className="text-xs text-muted">
                              {owner.phone} &middot; Joined{" "}
                              {new Date(owner.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="flex items-center gap-1.5 text-xs text-muted">
                            <Store className="w-3.5 h-3.5" />
                            <span>{owner.restaurants.length} restaurant{owner.restaurants.length !== 1 ? "s" : ""}</span>
                          </div>

                          <Button
                            variant={owner.isVerified ? "outline" : "primary"}
                            size="sm"
                            loading={toggleVerification.isPending}
                            onClick={() => toggleVerification.mutate(owner.id)}
                          >
                            {owner.isVerified ? (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                Unverify account
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Verify account
                              </>
                            )}
                          </Button>

                          {owner.restaurants.length > 0 && (
                            <button
                              onClick={() =>
                                setExpandedOwnerId(
                                  expandedOwnerId === owner.id
                                    ? null
                                    : owner.id
                                )
                              }
                              className="p-1.5 rounded-lg hover:bg-surface-elevated transition-colors text-muted"
                            >
                              {expandedOwnerId === owner.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedOwnerId === owner.id &&
                          owner.restaurants.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 pt-4 border-t border-line grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {owner.restaurants.map((restaurant) => (
                                  <div
                                    key={restaurant.id}
                                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-elevated border border-line"
                                  >
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold text-ink truncate">
                                        {restaurant.name}
                                      </p>
                                      <p className="text-xs text-muted">
                                        /{restaurant.slug}
                                      </p>
                                    </div>
                                    <Badge
                                      variant={
                                        restaurant.isActive ? "success" : "default"
                                      }
                                    >
                                      {restaurant.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
