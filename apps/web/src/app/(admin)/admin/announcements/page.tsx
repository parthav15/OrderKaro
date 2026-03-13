"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Megaphone, Trash2, Pencil, ToggleLeft, ToggleRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
      api
        .get(`/api/v1/canteens/${canteenId}/announcements`)
        .then((r) => r.data.data),
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
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Failed"),
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
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Failed"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/v1/canteens/${canteenId}/announcements/${id}`),
    onSuccess: () => {
      toast.success("Announcement deleted")
      queryClient.invalidateQueries({ queryKey: ["announcements"] })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.put(`/api/v1/canteens/${canteenId}/announcements/${id}`, {
        isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] })
    },
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
      expiresAt: a.expiresAt
        ? new Date(a.expiresAt).toISOString().slice(0, 16)
        : "",
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

  const isExpired = (a: Announcement) =>
    a.expiresAt && new Date(a.expiresAt) < new Date()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-black">
            Announcements
          </h1>
          <p className="text-neutral-500 mt-1">
            Banners shown to customers on the menu
          </p>
        </div>
        <div className="flex items-center gap-3">
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
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            New Announcement
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-neutral-100 animate-pulse"
            />
          ))}
        </div>
      )}

      {!isLoading && (!announcements || announcements.length === 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <Megaphone className="w-14 h-14 text-neutral-200 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-brand-black">
            No announcements
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Create one to show a banner on the consumer menu
          </p>
        </motion.div>
      )}

      {!isLoading && announcements && announcements.length > 0 && (
        <div className="space-y-3">
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
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-brand-black">
                          {a.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge
                            variant={
                              !a.isActive
                                ? "default"
                                : isExpired(a)
                                ? "warning"
                                : "success"
                            }
                          >
                            {!a.isActive
                              ? "Inactive"
                              : isExpired(a)
                              ? "Expired"
                              : "Active"}
                          </Badge>
                          {a.expiresAt && (
                            <span className="text-xs text-neutral-400">
                              Expires:{" "}
                              {new Date(a.expiresAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          )}
                          <span className="text-xs text-neutral-400">
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
                          onClick={() =>
                            toggleMutation.mutate({
                              id: a.id,
                              isActive: !a.isActive,
                            })
                          }
                          title={a.isActive ? "Deactivate" : "Activate"}
                          className="p-2 rounded-lg hover:bg-neutral-50 transition-colors"
                        >
                          {a.isActive ? (
                            <ToggleRight className="w-5 h-5 text-brand-black" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-neutral-400" />
                          )}
                        </button>
                        <button
                          onClick={() => openEdit(a)}
                          className="p-2 rounded-lg hover:bg-neutral-50 transition-colors"
                        >
                          <Pencil className="w-4 h-4 text-neutral-600" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Delete this announcement?")) {
                              deleteMutation.mutate(a.id)
                            }
                          }}
                          className="p-2 rounded-lg hover:bg-neutral-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-brand-red" />
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
        isOpen={showModal}
        onClose={closeModal}
        title={editing ? "Edit Announcement" : "New Announcement"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-brand-black">
              Message
            </label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="e.g. Closed for Holi on March 14th"
              rows={3}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-brand-black placeholder:text-neutral-400 transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20 resize-none"
              required
            />
          </div>

          <Input
            label="Expires At (optional)"
            type="datetime-local"
            value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
          />

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-brand-black">
              Active
            </label>
            <button
              type="button"
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className="p-1"
            >
              {form.isActive ? (
                <ToggleRight className="w-8 h-8 text-brand-black" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-neutral-400" />
              )}
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={closeModal}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editing ? "Save Changes" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
