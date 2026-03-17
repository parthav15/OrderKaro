"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Users, Mail, ShieldCheck, Trash2, ToggleLeft, ToggleRight, AlertTriangle, UserCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
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
  KITCHEN: "Kitchen Staff",
  COUNTER: "Counter Staff",
}

const roleDescription: Record<string, string> = {
  MANAGER: "Can manage staff, view analytics and wallet",
  KITCHEN: "Can view and update orders on Kitchen Display",
  COUNTER: "Can view and manage pickup counter orders",
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
  const [canteenId, setCanteenId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null)

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
    queryFn: () => api.get(`/api/v1/canteens/${canteenId}/staff`).then((r) => r.data.data),
    enabled: !!canteenId,
  })

  const addStaff = useMutation({
    mutationFn: (payload: typeof form) =>
      api.post(`/api/v1/canteens/${canteenId}/staff`, { ...payload, pin: payload.pin || undefined }),
    onSuccess: () => {
      toast.success("Staff member added")
      queryClient.invalidateQueries({ queryKey: ["staff", canteenId] })
      setShowModal(false)
      setForm(defaultForm)
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to add staff"),
  })

  const toggleStaff = useMutation({
    mutationFn: (staffId: string) =>
      api.patch(`/api/v1/canteens/${canteenId}/staff/${staffId}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff", canteenId] }),
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to update"),
  })

  const deleteStaff = useMutation({
    mutationFn: (staffId: string) =>
      api.delete(`/api/v1/canteens/${canteenId}/staff/${staffId}`),
    onSuccess: () => {
      toast.success("Staff member removed")
      queryClient.invalidateQueries({ queryKey: ["staff", canteenId] })
      setDeleteTarget(null)
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to remove"),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addStaff.mutate(form)
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-brand-red" />
            </div>
            <h1 className="text-3xl font-extrabold text-brand-black">Staff Management</h1>
          </div>
          <p className="text-neutral-500">Add and manage your kitchen and counter team members</p>
        </div>
        <Button size="lg" onClick={() => setShowModal(true)}>
          <Plus className="w-5 h-5" /> Add Staff Member
        </Button>
      </div>

      {canteens && canteens.length > 1 && (
        <div className="mb-6">
          <select
            value={canteenId || ""}
            onChange={(e) => setCanteenId(e.target.value)}
            className="px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-brand-red"
          >
            {canteens.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 rounded-xl bg-neutral-100 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!staff || staff.length === 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 border-2 border-dashed border-neutral-200 rounded-2xl"
        >
          <Users className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-brand-black mb-2">No staff members yet</h3>
          <p className="text-neutral-400 mb-6">Add your first team member to give them access to the system</p>
          <Button size="lg" onClick={() => setShowModal(true)}>
            <Plus className="w-5 h-5" /> Add First Staff Member
          </Button>
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
                  <CardContent className="py-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-brand-red/10 flex items-center justify-center">
                        <span className="text-brand-red font-extrabold text-xl">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <Badge variant={roleVariant[member.role] || "default"}>
                          {roleLabel[member.role] || member.role}
                        </Badge>
                        <Badge variant={member.isActive ? "success" : "default"}>
                          {member.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>

                    <h3 className="text-lg font-extrabold text-brand-black">{member.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      <p className="text-sm text-neutral-500 truncate">{member.email}</p>
                    </div>
                    {member.pin && (
                      <div className="flex items-center gap-2 mt-1">
                        <ShieldCheck className="w-4 h-4 text-neutral-400" />
                        <p className="text-sm text-neutral-400">PIN login enabled</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-5 pt-4 border-t border-neutral-100">
                      <button
                        onClick={() => toggleStaff.mutate(member.id)}
                        className="flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-brand-black transition-colors"
                      >
                        {member.isActive ? (
                          <ToggleRight className="w-6 h-6 text-brand-black" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-neutral-400" />
                        )}
                        {member.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(member)}
                        className="ml-auto flex items-center gap-1.5 text-sm font-semibold text-brand-red hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> Remove
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
        title="Remove Staff Member"
      >
        {deleteTarget && (
          <div className="space-y-5">
            <div className="flex items-start gap-4 p-4 bg-red-50 border border-brand-red/20 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-brand-red flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-brand-black">Remove {deleteTarget.name}?</p>
                <p className="text-sm text-neutral-600 mt-1">
                  They will lose access to the system immediately. This action cannot be undone.
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
                loading={deleteStaff.isPending}
                onClick={() => deleteStaff.mutate(deleteTarget.id)}
              >
                <Trash2 className="w-4 h-4" /> Yes, Remove
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setForm(defaultForm) }}
        title="Add New Staff Member"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-brand-black">Full Name</label>
            <input
              placeholder="e.g. Raju Sharma"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-brand-black placeholder:text-neutral-400 transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-brand-black">Email Address</label>
            <input
              type="email"
              placeholder="raju@yourcanteen.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-brand-black placeholder:text-neutral-400 transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-brand-black">Password</label>
            <input
              type="password"
              placeholder="Set a secure password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-brand-black placeholder:text-neutral-400 transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-brand-black">Role</label>
            <div className="space-y-2">
              {["MANAGER", "KITCHEN", "COUNTER"].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm({ ...form, role })}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                    form.role === role
                      ? "border-brand-black bg-brand-black text-white"
                      : "border-neutral-200 bg-white text-brand-black hover:border-neutral-300"
                  }`}
                >
                  <p className="font-bold text-sm">{roleLabel[role]}</p>
                  <p className={`text-xs mt-0.5 ${form.role === role ? "text-neutral-300" : "text-neutral-400"}`}>
                    {roleDescription[role]}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-brand-black">
              4-Digit PIN <span className="font-normal text-neutral-400">(optional, for quick login on shared devices)</span>
            </label>
            <input
              type="password"
              placeholder="e.g. 1234"
              maxLength={4}
              value={form.pin}
              onChange={(e) => setForm({ ...form, pin: e.target.value })}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-brand-black placeholder:text-neutral-400 transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => { setShowModal(false); setForm(defaultForm) }}
            >
              Cancel
            </Button>
            <Button type="submit" size="lg" className="flex-1" loading={addStaff.isPending}>
              <UserCircle2 className="w-5 h-5" /> Add Staff Member
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
