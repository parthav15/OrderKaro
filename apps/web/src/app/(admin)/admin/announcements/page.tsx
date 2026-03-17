"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Megaphone, Trash2, Pencil, ToggleLeft, ToggleRight, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import api from "@/lib/api"
import { toast } from "sonner"

interface Announcement {
  id: string
  message: string
  isActive: boolean
  expiresAt: string | null
  createdAt: string
}

const emptyForm = { message: "", isActive: true, expiresAt: "" }

export default function AnnouncementsPage() {
  const queryClient = useQueryClient()
  const [canteenId, setCanteenId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null)

  const { data: canteens } = useQuery({
    queryKey: ["canteens"],
    queryFn: () => api.get("/api/v1/canteens").then((r) => r.data.data),
  })

  useEffect(() => {
    if (canteens?.[0] && !canteenId) setCanteenId(canteens[0].id)
  }, [canteens, canteenId])

  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ["announcements", canteenId],
    queryFn: () =>
      api.get(`/api/v1/canteens/${canteenId}/announcements`).then((r) => r.data.data),
    enabled: !!canteenId,
  })

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) =>
      api.post(`/api/v1/canteens/${canteenId}/announcements`, {
        message: payload.message,
        isActive: payload.isActive,
        expiresAt: payload.expiresAt || undefined,
      }),
    onSuccess: () => {
      toast.success("Announcement created")
      queryClient.invalidateQueries({ queryKey: ["announcements"] })
      closeModal()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: typeof form }) =>
      api.put(`/api/v1/canteens/${canteenId}/announcements/${id}`, {
        message: payload.message,
        isActive: payload.isActive,
        expiresAt: payload.expiresAt || undefined,
      }),
    onSuccess: () => {
      toast.success("Announcement updated")
      queryClient.invalidateQueries({ queryKey: ["announcements"] })
      closeModal()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/v1/canteens/${canteenId}/announcements/${id}`),
    onSuccess: () => {
      toast.success("Announcement deleted")
      queryClient.invalidateQueries({ queryKey: ["announcements"] })
      setDeleteTarget(null)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.put(`/api/v1/canteens/${canteenId}/announcements/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["announcements"] }),
  })

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(a: Announcement) {
    setEditing(a)
    setForm({
      message: a.message,
      isActive: a.isActive,
      expiresAt: a.expiresAt ? new Date(a.expiresAt).toISOString().slice(0, 16) : "",
    })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditing(null)
    setForm(emptyForm)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const isExpired = (a: Announcement) => a.expiresAt && new Date(a.expiresAt) < new Date()

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-brand-red" />
            </div>
            <h1 className="text-3xl font-extrabold text-brand-black">Announcements</h1>
          </div>
          <p className="text-neutral-500">Banners shown to customers when they browse your menu</p>
        </div>
        <div className="flex items-center gap-3">
          {canteens && canteens.length > 1 && (
            <select
              value={canteenId || ""}
              onChange={(e) => setCanteenId(e.target.value)}
              className="px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-brand-red"
            >
              {canteens.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          <Button size="lg" onClick={openCreate}>
            <Plus className="w-5 h-5" /> New Announcement
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-neutral-100 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!announcements || announcements.length === 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 border-2 border-dashed border-neutral-200 rounded-2xl"
        >
          <Megaphone className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-brand-black mb-2">No announcements yet</h3>
          <p className="text-neutral-400 mb-6">
            Create an announcement to show important messages to your customers
          </p>
          <Button size="lg" onClick={openCreate}>
            <Plus className="w-5 h-5" /> Create First Announcement
          </Button>
        </motion.div>
      )}

      {!isLoading && announcements && announcements.length > 0 && (
        <div className="space-y-4">
          <AnimatePresence>
            {announcements.map((a, idx) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card>
                  <CardContent className="py-5">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-bold text-brand-black leading-snug">{a.message}</p>
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <Badge
                            variant={!a.isActive ? "default" : isExpired(a) ? "warning" : "success"}
                          >
                            {!a.isActive ? "Inactive" : isExpired(a) ? "Expired" : "Live — Visible to customers"}
                          </Badge>
                          {a.expiresAt && (
                            <span className="text-sm text-neutral-400">
                              Expires:{" "}
                              {new Date(a.expiresAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                          <span className="text-sm text-neutral-400">
                            Created:{" "}
                            {new Date(a.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => toggleMutation.mutate({ id: a.id, isActive: !a.isActive })}
                          title={a.isActive ? "Deactivate — hide from customers" : "Activate — show to customers"}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-50 transition-colors text-sm font-semibold text-neutral-600"
                        >
                          {a.isActive ? (
                            <ToggleRight className="w-6 h-6 text-brand-black" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-neutral-400" />
                          )}
                          {a.isActive ? "On" : "Off"}
                        </button>
                        <button
                          onClick={() => openEdit(a)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-50 transition-colors text-sm font-semibold text-neutral-600"
                        >
                          <Pencil className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(a)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors text-sm font-semibold text-brand-red border border-brand-red/30"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
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
        title="Delete Announcement"
      >
        {deleteTarget && (
          <div className="space-y-5">
            <div className="flex items-start gap-4 p-4 bg-red-50 border border-brand-red/20 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-brand-red flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-brand-black">Delete this announcement?</p>
                <p className="text-sm text-neutral-600 mt-1 line-clamp-2">"{deleteTarget.message}"</p>
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
                loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
              >
                <Trash2 className="w-4 h-4" /> Yes, Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editing ? "Edit Announcement" : "New Announcement"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-brand-black">
              Message
            </label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="e.g. Closed for Holi on March 14th. Reopening March 15th morning."
              rows={4}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-brand-black placeholder:text-neutral-400 transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20 resize-none"
              required
            />
            <p className="text-xs text-neutral-400">This message will appear as a banner on your menu page</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-brand-black">
              Expiry Date & Time <span className="font-normal text-neutral-400">(optional)</span>
            </label>
            <input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-brand-black transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
            />
            <p className="text-xs text-neutral-400">Leave blank to keep it active indefinitely</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <div>
              <p className="text-sm font-bold text-brand-black">Show to Customers</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                {form.isActive ? "This banner is currently visible on your menu" : "This banner is hidden from customers"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className="p-1 flex-shrink-0"
            >
              {form.isActive ? (
                <ToggleRight className="w-10 h-10 text-brand-black" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-neutral-400" />
              )}
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" size="lg" className="flex-1" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              className="flex-1"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              <Megaphone className="w-5 h-5" /> {editing ? "Save Changes" : "Publish Announcement"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
