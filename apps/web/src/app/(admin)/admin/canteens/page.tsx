"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Store, Clock, Pencil, Trash2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Failed to create canteen"),
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
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Failed to update"),
  })

  const deleteCanteen = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/canteens/${id}`),
    onSuccess: () => {
      toast.success("Canteen deleted")
      queryClient.invalidateQueries({ queryKey: ["canteens"] })
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Failed to delete"),
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
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
  }

  const isMutating =
    createCanteen.isPending || updateCanteen.isPending

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-black">Canteens</h1>
          <p className="text-neutral-500 mt-1">Manage all your canteen locations</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4" />
          Add Canteen
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-neutral-100 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!canteens || canteens.length === 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <Store className="w-14 h-14 text-neutral-200 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-brand-black">No canteens yet</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Create your first canteen to start taking orders
          </p>
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
                  <CardContent>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-11 h-11 rounded-xl bg-brand-red/10 flex items-center justify-center flex-shrink-0">
                        <Store className="w-5 h-5 text-brand-red" />
                      </div>
                      <Badge variant={canteen.isActive ? "success" : "default"}>
                        {canteen.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-brand-black text-lg">{canteen.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-sm text-neutral-400">/{canteen.slug}</span>
                      <a
                        href={`/${canteen.slug}/menu`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-red hover:opacity-70 transition-opacity"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {canteen.description && (
                      <p className="text-sm text-neutral-500 mt-2 line-clamp-2">
                        {canteen.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-3">
                      {canteen.openingTime && canteen.closingTime && (
                        <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                          <Clock className="w-3.5 h-3.5" />
                          {canteen.openingTime} – {canteen.closingTime}
                        </div>
                      )}
                      <span className="text-sm text-neutral-500">
                        ~{canteen.avgPrepTime} min prep
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-100">
                      <button
                        onClick={() => openEditModal(canteen)}
                        className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-brand-black transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Delete "${canteen.name}"? This cannot be undone.`
                            )
                          ) {
                            deleteCanteen.mutate(canteen.id)
                          }
                        }}
                        className="ml-auto flex items-center gap-1.5 text-sm text-brand-red hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
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
        isOpen={showModal}
        onClose={closeModal}
        title={editingCanteen ? "Edit Canteen" : "New Canteen"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Canteen Name"
            placeholder="e.g. Main Campus Cafeteria"
            value={form.name}
            onChange={(e) => {
              const name = e.target.value
              setForm((f) => ({
                ...f,
                name,
                slug: editingCanteen ? f.slug : generateSlug(name),
              }))
            }}
            required
          />

          <Input
            label="URL Slug"
            placeholder="e.g. main-campus"
            value={form.slug}
            onChange={(e) =>
              setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })
            }
            required
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-brand-black">
              Description (optional)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of this canteen"
              rows={2}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-brand-black placeholder:text-neutral-400 transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Opening Time"
              type="time"
              value={form.openingTime}
              onChange={(e) => setForm({ ...form, openingTime: e.target.value })}
            />
            <Input
              label="Closing Time"
              type="time"
              value={form.closingTime}
              onChange={(e) => setForm({ ...form, closingTime: e.target.value })}
            />
          </div>

          <Input
            label="Avg Prep Time (minutes)"
            type="number"
            min="1"
            max="120"
            value={String(form.avgPrepTime)}
            onChange={(e) =>
              setForm({ ...form, avgPrepTime: Number(e.target.value) })
            }
            required
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={closeModal}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={isMutating}>
              {editingCanteen ? "Save Changes" : "Create Canteen"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
