"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Store, Clock, Pencil, Trash2, ExternalLink, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import api from "@/lib/api"
import { toast } from "sonner"

interface Canteen {
  id: string
  name: string
  slug: string
  description: string | null
  openingTime: string | null
  closingTime: string | null
  avgPrepTime: number
  isActive: boolean
}

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  openingTime: "",
  closingTime: "",
  avgPrepTime: 15,
}

export default function CanteensPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingCanteen, setEditingCanteen] = useState<Canteen | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<Canteen | null>(null)

  const { data: canteens, isLoading } = useQuery<Canteen[]>({
    queryKey: ["canteens"],
    queryFn: () => api.get("/api/v1/canteens").then((r) => r.data.data),
  })

  const createCanteen = useMutation({
    mutationFn: (payload: typeof form) =>
      api.post("/api/v1/canteens", {
        ...payload,
        openingTime: payload.openingTime || undefined,
        closingTime: payload.closingTime || undefined,
        description: payload.description || undefined,
      }),
    onSuccess: () => {
      toast.success("Canteen created")
      queryClient.invalidateQueries({ queryKey: ["canteens"] })
      closeModal()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to create canteen"),
  })

  const updateCanteen = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: typeof form }) =>
      api.put(`/api/v1/canteens/${id}`, {
        ...payload,
        openingTime: payload.openingTime || undefined,
        closingTime: payload.closingTime || undefined,
        description: payload.description || undefined,
      }),
    onSuccess: () => {
      toast.success("Canteen updated")
      queryClient.invalidateQueries({ queryKey: ["canteens"] })
      closeModal()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to update"),
  })

  const deleteCanteen = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/canteens/${id}`),
    onSuccess: () => {
      toast.success("Canteen deleted")
      queryClient.invalidateQueries({ queryKey: ["canteens"] })
      setDeleteTarget(null)
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to delete"),
  })

  function openCreateModal() {
    setEditingCanteen(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEditModal(canteen: Canteen) {
    setEditingCanteen(canteen)
    setForm({
      name: canteen.name,
      slug: canteen.slug,
      description: canteen.description ?? "",
      openingTime: canteen.openingTime ?? "",
      closingTime: canteen.closingTime ?? "",
      avgPrepTime: canteen.avgPrepTime,
    })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingCanteen(null)
    setForm(emptyForm)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingCanteen) {
      updateCanteen.mutate({ id: editingCanteen.id, payload: form })
    } else {
      createCanteen.mutate(form)
    }
  }

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
  }

  const isMutating = createCanteen.isPending || updateCanteen.isPending

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-brand-red" />
            </div>
            <h1 className="text-3xl font-extrabold text-brand-black">Canteens</h1>
          </div>
          <p className="text-neutral-500">Manage all your canteen locations and their settings</p>
        </div>
        <Button size="lg" onClick={openCreateModal}>
          <Plus className="w-5 h-5" /> Add Canteen
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-neutral-100 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!canteens || canteens.length === 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 border-2 border-dashed border-neutral-200 rounded-2xl"
        >
          <Store className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-brand-black mb-2">No canteens yet</h3>
          <p className="text-neutral-400 mb-6">Create your first canteen location to start taking orders</p>
          <Button size="lg" onClick={openCreateModal}>
            <Plus className="w-5 h-5" /> Create First Canteen
          </Button>
        </motion.div>
      )}

      {!isLoading && canteens && canteens.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {canteens.map((canteen, idx) => (
              <motion.div
                key={canteen.id}
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
                      <Badge variant={canteen.isActive ? "success" : "default"}>
                        {canteen.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <h3 className="text-xl font-extrabold text-brand-black">{canteen.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-neutral-400">/{canteen.slug}</span>
                      <a
                        href={`/${canteen.slug}/menu`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-brand-red text-sm font-semibold hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View Menu
                      </a>
                    </div>

                    {canteen.description && (
                      <p className="text-sm text-neutral-500 mt-2 line-clamp-2">{canteen.description}</p>
                    )}

                    <div className="flex items-center gap-5 mt-4 pt-4 border-t border-neutral-100">
                      {canteen.openingTime && canteen.closingTime && (
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                          <Clock className="w-4 h-4 text-neutral-400" />
                          <span className="font-semibold">{canteen.openingTime} – {canteen.closingTime}</span>
                        </div>
                      )}
                      <span className="text-sm text-neutral-500">
                        ~{canteen.avgPrepTime} min avg prep
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditModal(canteen)}
                      >
                        <Pencil className="w-4 h-4" /> Edit Canteen
                      </Button>
                      <button
                        onClick={() => setDeleteTarget(canteen)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-brand-red/30 text-sm font-semibold text-brand-red hover:bg-red-50 transition-colors"
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
        title="Delete Canteen"
      >
        {deleteTarget && (
          <div className="space-y-5">
            <div className="flex items-start gap-4 p-4 bg-red-50 border border-brand-red/20 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-brand-red flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-brand-black">Delete "{deleteTarget.name}"?</p>
                <p className="text-sm text-neutral-600 mt-1">
                  This will permanently delete this canteen, all its menus, tables, staff, and data. This cannot be undone.
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
                loading={deleteCanteen.isPending}
                onClick={() => deleteCanteen.mutate(deleteTarget.id)}
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
        title={editingCanteen ? "Edit Canteen" : "Add New Canteen"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-brand-black">Canteen Name</label>
            <input
              placeholder="e.g. Main Campus Cafeteria"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value
                setForm((f) => ({ ...f, name, slug: editingCanteen ? f.slug : generateSlug(name) }))
              }}
              required
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-brand-black placeholder:text-neutral-400 transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-brand-black">URL Slug</label>
            <input
              placeholder="e.g. main-campus"
              value={form.slug}
              onChange={(e) =>
                setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })
              }
              required
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-brand-black placeholder:text-neutral-400 transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
            />
            {form.slug && (
              <p className="text-xs text-neutral-400">Menu URL: /{form.slug}/menu</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-brand-black">
              Description <span className="font-normal text-neutral-400">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of this canteen"
              rows={2}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-brand-black placeholder:text-neutral-400 transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-brand-black">Opening Time</label>
              <input
                type="time"
                value={form.openingTime}
                onChange={(e) => setForm({ ...form, openingTime: e.target.value })}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-brand-black transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-brand-black">Closing Time</label>
              <input
                type="time"
                value={form.closingTime}
                onChange={(e) => setForm({ ...form, closingTime: e.target.value })}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-brand-black transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-brand-black">Average Prep Time (minutes)</label>
            <input
              type="number"
              min="1"
              max="120"
              value={String(form.avgPrepTime)}
              onChange={(e) => setForm({ ...form, avgPrepTime: Number(e.target.value) })}
              required
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-brand-black placeholder:text-neutral-400 transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
            />
            <p className="text-xs text-neutral-400">Shown to customers as estimated wait time</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" size="lg" className="flex-1" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" size="lg" className="flex-1" loading={isMutating}>
              {editingCanteen ? "Save Changes" : "Create Canteen"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
