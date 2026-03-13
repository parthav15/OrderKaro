"use client"

import { useState } from "react"
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
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/stores/auth"
import api from "@/lib/api"
import { toast } from "sonner"
import { formatPrice } from "@/lib/utils"

interface OwnerCanteen {
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
  canteens: OwnerCanteen[]
}

interface SystemStats {
  totalOwners: number
  totalCanteens: number
  activeCanteens: number
  totalOrders: number
  totalRevenue: number
}

const SUPER_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "admin@orderkaro.com"

export default function SuperAdminPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [expandedOwnerId, setExpandedOwnerId] = useState<string | null>(null)

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL

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
        <Shield className="w-16 h-16 text-neutral-200 mb-4" />
        <h2 className="text-xl font-bold text-brand-black">Access Denied</h2>
        <p className="text-neutral-500 mt-2 text-sm">
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
      bg: "bg-red-50",
      color: "text-brand-red",
    },
    {
      label: "Total Canteens",
      value: stats?.totalCanteens ?? 0,
      icon: Store,
      bg: "bg-neutral-100",
      color: "text-brand-black",
    },
    {
      label: "Active Canteens",
      value: stats?.activeCanteens ?? 0,
      icon: CheckCircle2,
      bg: "bg-neutral-100",
      color: "text-brand-black",
    },
    {
      label: "Total Orders",
      value: stats?.totalOrders ?? 0,
      icon: ShoppingBag,
      bg: "bg-neutral-100",
      color: "text-brand-black",
    },
    {
      label: "Total Revenue",
      value: formatPrice(stats?.totalRevenue ?? 0),
      icon: TrendingUp,
      bg: "bg-neutral-100",
      color: "text-brand-black",
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
          <h1 className="text-2xl font-extrabold text-brand-black">
            Super Admin
          </h1>
        </div>
        <p className="text-neutral-500 text-sm">
          System-wide owner and canteen management
        </p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
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
                    <p className="text-xs text-neutral-500 truncate">
                      {stat.label}
                    </p>
                    <p className="text-xl font-extrabold text-brand-black leading-tight">
                      {statsLoading ? (
                        <span className="inline-block w-10 h-5 bg-neutral-100 animate-pulse rounded" />
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
          <h2 className="text-lg font-bold text-brand-black">All Owners</h2>
          <div className="w-72">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-300 bg-white text-sm text-brand-black placeholder:text-neutral-400 focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-colors"
              />
            </div>
          </div>
        </div>

        {ownersLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-neutral-100 animate-pulse"
              />
            ))}
          </div>
        )}

        {!ownersLoading && filteredOwners.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 border border-dashed border-neutral-200 rounded-2xl"
          >
            <Users className="w-12 h-12 text-neutral-200 mx-auto mb-3" />
            <p className="text-neutral-400 font-medium">
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
                              <p className="font-bold text-brand-black text-sm">
                                {owner.name}
                              </p>
                              <Badge
                                variant={owner.isVerified ? "success" : "warning"}
                              >
                                {owner.isVerified ? "Verified" : "Unverified"}
                              </Badge>
                            </div>
                            <p className="text-xs text-neutral-500 truncate">
                              {owner.email}
                            </p>
                            <p className="text-xs text-neutral-400">
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
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                            <Store className="w-3.5 h-3.5" />
                            <span>{owner.canteens.length} canteen{owner.canteens.length !== 1 ? "s" : ""}</span>
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
                                Unverify
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Verify
                              </>
                            )}
                          </Button>

                          {owner.canteens.length > 0 && (
                            <button
                              onClick={() =>
                                setExpandedOwnerId(
                                  expandedOwnerId === owner.id
                                    ? null
                                    : owner.id
                                )
                              }
                              className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-500"
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
                          owner.canteens.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 pt-4 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {owner.canteens.map((canteen) => (
                                  <div
                                    key={canteen.id}
                                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-100"
                                  >
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold text-brand-black truncate">
                                        {canteen.name}
                                      </p>
                                      <p className="text-xs text-neutral-400">
                                        /{canteen.slug}
                                      </p>
                                    </div>
                                    <Badge
                                      variant={
                                        canteen.isActive ? "success" : "default"
                                      }
                                    >
                                      {canteen.isActive ? "Active" : "Inactive"}
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
