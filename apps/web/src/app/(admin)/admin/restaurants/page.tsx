"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Store, Clock, Pencil, Trash2, ExternalLink, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { CountryPicker } from "@/components/ui/country-picker"
import api from "@/lib/api"
import { toast } from "sonner"

interface Restaurant {
  id: string
  name: string
  slug: string
  description: string | null
  openingTime: string | null
  closingTime: string | null
  avgPrepTime: number
  country?: string
  isActive: boolean
}

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  openingTime: "",
  closingTime: "",
  avgPrepTime: 15,
  country: "IN",
}

export default function RestaurantsPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<Restaurant | null>(null)

  const { data: restaurants, isLoading } = useQuery<Restaurant[]>({
    queryKey: ["restaurants"],
    queryFn: () => api.get("/api/v1/restaurants").then((r) => r.data.data),
  })

  const createRestaurant = useMutation({
    mutationFn: (payload: typeof form) =>
      api.post("/api/v1/restaurants", {
        ...payload,
        openingTime: payload.openingTime || undefined,
        closingTime: payload.closingTime || undefined,
        description: payload.description || undefined,
      }),
    onSuccess: () => {
      toast.success("Restaurant created")
      queryClient.invalidateQueries({ queryKey: ["restaurants"] })
      closeModal()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to create restaurant"),
  })

  const updateRestaurant = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: typeof form }) =>
      api.put(`/api/v1/restaurants/${id}`, {
        ...payload,
        openingTime: payload.openingTime || undefined,
        closingTime: payload.closingTime || undefined,
        description: payload.description || undefined,
      }),
    onSuccess: () => {
      toast.success("Restaurant updated")
      queryClient.invalidateQueries({ queryKey: ["restaurants"] })
      closeModal()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to update"),
  })

  const deleteRestaurant = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/restaurants/${id}`),
    onSuccess: () => {
      toast.success("Restaurant deleted")
      queryClient.invalidateQueries({ queryKey: ["restaurants"] })
      setDeleteTarget(null)
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to delete"),
  })

  function openCreateModal() {
    setEditingRestaurant(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEditModal(restaurant: Restaurant) {
    setEditingRestaurant(restaurant)
    setForm({
      name: restaurant.name,
      slug: restaurant.slug,
      description: restaurant.description ?? "",
      openingTime: restaurant.openingTime ?? "",
      closingTime: restaurant.closingTime ?? "",
      avgPrepTime: restaurant.avgPrepTime,
      country: restaurant.country ?? "IN",
    })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingRestaurant(null)
    setForm(emptyForm)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingRestaurant) {
      updateRestaurant.mutate({ id: editingRestaurant.id, payload: form })
    } else {
      createRestaurant.mutate(form)
    }
  }

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
  }

  const isMutating = createRestaurant.isPending || updateRestaurant.isPending

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-brand-red" />
            </div>
            <h1 className="text-3xl font-extrabold text-ink">Restaurants</h1>
          </div>
          <p className="text-muted">Manage all your restaurant locations and their settings</p>
        </div>
        <Button size="lg" onClick={openCreateModal}>
          <Plus className="w-5 h-5" /> Add Restaurant
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-surface-elevated animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!restaurants || restaurants.length === 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 border-2 border-dashed border-line rounded-2xl"
        >
          <Store className="w-16 h-16 text-muted/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-ink mb-2">No restaurants yet</h3>
          <p className="text-muted mb-6">Create your first restaurant location to start taking orders</p>
          <Button size="lg" onClick={openCreateModal}>
            <Plus className="w-5 h-5" /> Create First Restaurant
          </Button>
        </motion.div>
      )}

      {!isLoading && restaurants && restaurants.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {restaurants.map((restaurant, idx) => (
              <motion.div
                key={restaurant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.07 }}
              >
                <Card>
                  <CardContent className="py-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-brand-red/10 flex items-center justify-center flex-shrink-0">
                        <Store className="w-7 h-7 text-brand-red" />
                      </div>
                      <Badge variant={restaurant.isActive ? "success" : "default"}>
                        {restaurant.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <h3 className="text-xl font-extrabold text-ink">{restaurant.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted">/{restaurant.slug}</span>
                      <a
                        href={`/${restaurant.slug}/menu`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-brand-red text-sm font-semibold hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View Menu
                      </a>
                    </div>

                    {restaurant.description && (
                      <p className="text-sm text-muted mt-2 line-clamp-2">{restaurant.description}</p>
                    )}

                    <div className="flex items-center gap-5 mt-4 pt-4 border-t border-line">
                      {restaurant.openingTime && restaurant.closingTime && (
                        <div className="flex items-center gap-2 text-sm text-muted">
                          <Clock className="w-4 h-4 text-muted" />
                          <span className="font-semibold">{restaurant.openingTime} – {restaurant.closingTime}</span>
                        </div>
                      )}
                      <span className="text-sm text-muted">
                        ~{restaurant.avgPrepTime} min avg prep
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditModal(restaurant)}
                      >
                        <Pencil className="w-4 h-4" /> Edit Restaurant
                      </Button>
                      <button
                        onClick={() => setDeleteTarget(restaurant)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-brand-red/30 text-sm font-semibold text-brand-red hover:bg-primary/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Restaurant"
      >
        {deleteTarget && (
          <div className="space-y-5">
            <div className="flex items-start gap-4 p-4 bg-primary/10 border border-brand-red/20 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-brand-red flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-ink">Delete "{deleteTarget.name}"?</p>
                <p className="text-sm text-muted mt-1">
                  This will permanently delete this restaurant, all its menus, tables, staff, and data. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button size="lg" variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                size="lg"
                variant="danger"
                className="flex-1"
                loading={deleteRestaurant.isPending}
                onClick={() => deleteRestaurant.mutate(deleteTarget.id)}
              >
                <Trash2 className="w-4 h-4" /> Yes, Delete Permanently
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingRestaurant ? "Edit Restaurant" : "Add New Restaurant"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-ink">Restaurant Name</label>
            <input
              placeholder="e.g. Main Campus Cafeteria"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value
                setForm((f) => ({ ...f, name, slug: editingRestaurant ? f.slug : generateSlug(name) }))
              }}
              required
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-muted transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-ink">Country</label>
            <CountryPicker value={form.country} onChange={(country) => setForm((f) => ({ ...f, country }))} />
            <p className="text-xs text-muted">
              Sets the payment gateway (India → Cashfree, elsewhere → Stripe) and the menu currency.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-ink">URL Slug</label>
            <input
              placeholder="e.g. main-campus"
              value={form.slug}
              onChange={(e) =>
                setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })
              }
              required
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-muted transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
            />
            {form.slug && (
              <p className="text-xs text-muted">Menu URL: /{form.slug}/menu</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-ink">
              Description <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of this restaurant"
              rows={2}
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-muted transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-ink">Opening Time</label>
              <input
                type="time"
                value={form.openingTime}
                onChange={(e) => setForm({ ...form, openingTime: e.target.value })}
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-ink">Closing Time</label>
              <input
                type="time"
                value={form.closingTime}
                onChange={(e) => setForm({ ...form, closingTime: e.target.value })}
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-ink">Average Prep Time (minutes)</label>
            <input
              type="number"
              min="1"
              max="120"
              value={String(form.avgPrepTime)}
              onChange={(e) => setForm({ ...form, avgPrepTime: Number(e.target.value) })}
              required
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-muted transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
            />
            <p className="text-xs text-muted">Shown to customers as estimated wait time</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" size="lg" className="flex-1" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" size="lg" className="flex-1" loading={isMutating}>
              {editingRestaurant ? "Save Changes" : "Create Restaurant"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
