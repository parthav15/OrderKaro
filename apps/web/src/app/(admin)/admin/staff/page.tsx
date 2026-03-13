"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Users, Mail, ShieldCheck, Trash2, ToggleLeft, ToggleRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { useAuthStore } from "@/stores/auth"
import api from "@/lib/api"
import { toast } from "sonner"

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  pin: string | null
  createdAt: string
}

const roleVariant: Record<string, "default" | "warning" | "success" | "danger"> = {
  MANAGER: "warning",
  KITCHEN: "success",
  COUNTER: "default",
}

const roleLabel: Record<string, string> = {
  MANAGER: "Manager",
  KITCHEN: "Kitchen",
  COUNTER: "Counter",
}

const defaultForm = {
  name: "",
  email: "",
  password: "",
  role: "KITCHEN",
  pin: "",
}

export default function StaffManagement() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [canteenId, setCanteenId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(defaultForm)

  const { data: canteens } = useQuery({
    queryKey: ["canteens"],
    queryFn: () => api.get("/api/v1/canteens").then((r) => r.data.data),
  })

  useEffect(() => {
    if (canteens?.[0] && !canteenId) {
      setCanteenId(canteens[0].id)
    }
  }, [canteens, canteenId])

  const { data: staff, isLoading } = useQuery<StaffMember[]>({
    queryKey: ["staff", canteenId],
    queryFn: () =>
      api
        .get(`/api/v1/canteens/${canteenId}/staff`)
        .then((r) => r.data.data),
    enabled: !!canteenId,
  })

  const addStaff = useMutation({
    mutationFn: (payload: typeof form) =>
      api.post(`/api/v1/canteens/${canteenId}/staff`, {
        ...payload,
        pin: payload.pin || undefined,
      }),
    onSuccess: () => {
      toast.success("Staff member added")
      queryClient.invalidateQueries({ queryKey: ["staff", canteenId] })
      setShowModal(false)
      setForm(defaultForm)
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Failed to add staff"),
  })

  const toggleStaff = useMutation({
    mutationFn: (staffId: string) =>
      api.patch(`/api/v1/canteens/${canteenId}/staff/${staffId}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", canteenId] })
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Failed to update"),
  })

  const deleteStaff = useMutation({
    mutationFn: (staffId: string) =>
      api.delete(`/api/v1/canteens/${canteenId}/staff/${staffId}`),
    onSuccess: () => {
      toast.success("Staff member removed")
      queryClient.invalidateQueries({ queryKey: ["staff", canteenId] })
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Failed to remove"),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addStaff.mutate(form)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-black">Staff Management</h1>
          <p className="text-neutral-500 mt-1">Manage your canteen team members</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" />
          Add Staff
        </Button>
      </div>

      {canteens && canteens.length > 1 && (
        <div className="mb-6">
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
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-36 rounded-xl bg-neutral-100 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!staff || staff.length === 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <Users className="w-14 h-14 text-neutral-200 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-brand-black">No staff members yet</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Add your first team member to get started
          </p>
        </motion.div>
      )}

      {!isLoading && staff && staff.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {staff.map((member, idx) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={!member.isActive ? "opacity-60" : ""}>
                  <CardContent>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-full bg-brand-red/10 flex items-center justify-center">
                        <span className="text-brand-red font-bold text-sm">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={roleVariant[member.role] || "default"}>
                          {roleLabel[member.role] || member.role}
                        </Badge>
                        <Badge variant={member.isActive ? "success" : "default"}>
                          {member.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>

                    <h3 className="font-bold text-brand-black">{member.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Mail className="w-3.5 h-3.5 text-neutral-400" />
                      <p className="text-sm text-neutral-500 truncate">{member.email}</p>
                    </div>
                    {member.pin && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                        <p className="text-xs text-neutral-400">PIN enabled</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-100">
                      <button
                        onClick={() => toggleStaff.mutate(member.id)}
                        className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-brand-black transition-colors"
                      >
                        {member.isActive ? (
                          <ToggleRight className="w-5 h-5 text-brand-black" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-neutral-400" />
                        )}
                        {member.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove ${member.name}?`)) {
                            deleteStaff.mutate(member.id)
                          }
                        }}
                        className="ml-auto flex items-center gap-1.5 text-sm text-brand-red hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
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
        onClose={() => {
          setShowModal(false)
          setForm(defaultForm)
        }}
        title="Add Staff Member"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Enter name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="staff@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Set a password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-brand-black">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-brand-black focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
            >
              <option value="MANAGER">Manager</option>
              <option value="KITCHEN">Kitchen</option>
              <option value="COUNTER">Counter</option>
            </select>
          </div>

          <Input
            label="PIN (optional)"
            type="password"
            placeholder="4-digit PIN for quick login"
            maxLength={4}
            value={form.pin}
            onChange={(e) => setForm({ ...form, pin: e.target.value })}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowModal(false)
                setForm(defaultForm)
              }}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={addStaff.isPending}>
              Add Member
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
