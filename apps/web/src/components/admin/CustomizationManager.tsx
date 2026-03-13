"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Settings2,
  Check,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import api from "@/lib/api"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"

interface CustomizationOption {
  id: string
  name: string
  priceAdjustment: string
}

interface CustomizationGroup {
  id: string
  name: string
  type: "SINGLE_SELECT" | "MULTI_SELECT"
  isRequired: boolean
  options: CustomizationOption[]
}

interface CustomizationManagerProps {
  itemId: string
  itemName: string
  canteenId: string
  onClose: () => void
}

const emptyGroupForm: { name: string; type: "SINGLE_SELECT" | "MULTI_SELECT"; isRequired: boolean } = { name: "", type: "SINGLE_SELECT", isRequired: false }
const emptyOptionForm = { name: "", priceAdjustment: "0" }

export function CustomizationManager({
  itemId,
  itemName,
  canteenId,
  onClose,
}: CustomizationManagerProps) {
  const queryClient = useQueryClient()
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

  const [showGroupModal, setShowGroupModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<CustomizationGroup | null>(null)
  const [groupForm, setGroupForm] = useState(emptyGroupForm)

  const [showOptionModal, setShowOptionModal] = useState(false)
  const [editingOption, setEditingOption] = useState<CustomizationOption | null>(null)
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [optionForm, setOptionForm] = useState(emptyOptionForm)

  const queryKey = ["customizations", canteenId, itemId]
  const baseUrl = `/api/v1/canteens/${canteenId}/menu/items/${itemId}/customizations`

  const { data: customizations, isLoading } = useQuery<CustomizationGroup[]>({
    queryKey,
    queryFn: () => api.get(baseUrl).then((r) => r.data.data),
  })

  const createGroup = useMutation({
    mutationFn: (data: typeof emptyGroupForm) => api.post(baseUrl, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setShowGroupModal(false)
      setGroupForm(emptyGroupForm)
      toast.success("Customization group created")
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to create group"),
  })

  const updateGroup = useMutation({
    mutationFn: ({ custId, data }: { custId: string; data: typeof emptyGroupForm }) =>
      api.put(`${baseUrl}/${custId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setShowGroupModal(false)
      setEditingGroup(null)
      setGroupForm(emptyGroupForm)
      toast.success("Customization group updated")
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to update group"),
  })

  const deleteGroup = useMutation({
    mutationFn: (custId: string) => api.delete(`${baseUrl}/${custId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success("Customization group deleted")
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to delete group"),
  })

  const createOption = useMutation({
    mutationFn: ({ custId, data }: { custId: string; data: typeof emptyOptionForm }) =>
      api.post(`${baseUrl}/${custId}/options`, {
        name: data.name,
        priceAdjustment: Number(data.priceAdjustment),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setShowOptionModal(false)
      setOptionForm(emptyOptionForm)
      setActiveGroupId(null)
      toast.success("Option added")
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to add option"),
  })

  const updateOption = useMutation({
    mutationFn: ({
      custId,
      optId,
      data,
    }: {
      custId: string
      optId: string
      data: typeof emptyOptionForm
    }) =>
      api.put(`${baseUrl}/${custId}/options/${optId}`, {
        name: data.name,
        priceAdjustment: Number(data.priceAdjustment),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setShowOptionModal(false)
      setEditingOption(null)
      setActiveGroupId(null)
      setOptionForm(emptyOptionForm)
      toast.success("Option updated")
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to update option"),
  })

  const deleteOption = useMutation({
    mutationFn: ({ custId, optId }: { custId: string; optId: string }) =>
      api.delete(`${baseUrl}/${custId}/options/${optId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success("Option deleted")
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to delete option"),
  })

  function openAddGroup() {
    setEditingGroup(null)
    setGroupForm(emptyGroupForm)
    setShowGroupModal(true)
  }

  function openEditGroup(group: CustomizationGroup) {
    setEditingGroup(group)
    setGroupForm({ name: group.name, type: group.type, isRequired: group.isRequired })
    setShowGroupModal(true)
  }

  function openAddOption(groupId: string) {
    setEditingOption(null)
    setActiveGroupId(groupId)
    setOptionForm(emptyOptionForm)
    setShowOptionModal(true)
  }

  function openEditOption(group: CustomizationGroup, option: CustomizationOption) {
    setEditingOption(option)
    setActiveGroupId(group.id)
    setOptionForm({ name: option.name, priceAdjustment: String(option.priceAdjustment) })
    setShowOptionModal(true)
  }

  function handleGroupSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingGroup) {
      updateGroup.mutate({ custId: editingGroup.id, data: groupForm })
    } else {
      createGroup.mutate(groupForm)
    }
  }

  function handleOptionSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeGroupId) return
    if (editingOption) {
      updateOption.mutate({ custId: activeGroupId, optId: editingOption.id, data: optionForm })
    } else {
      createOption.mutate({ custId: activeGroupId, data: optionForm })
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
        <div>
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-brand-red" />
            <h2 className="text-lg font-bold text-brand-black">Customizations</h2>
          </div>
          <p className="text-sm text-neutral-500 mt-0.5">{itemName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={openAddGroup}>
            <Plus className="w-4 h-4" />
            Add Group
          </Button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-neutral-100 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && (!customizations || customizations.length === 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 border border-dashed border-neutral-200 rounded-2xl"
          >
            <Settings2 className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
            <p className="text-neutral-400 font-medium text-sm">No customization groups yet</p>
            <p className="text-neutral-300 text-xs mt-1">Add a group like "Spice Level" or "Add-ons"</p>
            <Button size="sm" className="mt-4" onClick={openAddGroup}>
              <Plus className="w-4 h-4" />
              Add First Group
            </Button>
          </motion.div>
        )}

        <div className="space-y-4">
          <AnimatePresence>
            {customizations?.map((group, groupIdx) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: groupIdx * 0.05 }}
                className="rounded-xl border border-neutral-100 bg-white shadow-sm overflow-hidden"
              >
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-neutral-50 transition-colors"
                  onClick={() =>
                    setExpandedGroup(expandedGroup === group.id ? null : group.id)
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-brand-black text-sm">{group.name}</span>
                        <Badge variant={group.type === "SINGLE_SELECT" ? "default" : "warning"}>
                          {group.type === "SINGLE_SELECT" ? "Single" : "Multi"}
                        </Badge>
                        {group.isRequired && (
                          <Badge variant="danger">Required</Badge>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {group.options?.length || 0} option{group.options?.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEditGroup(group)}
                      className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5 text-neutral-500" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${group.name}" and all its options?`)) {
                          deleteGroup.mutate(group.id)
                        }
                      }}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-brand-red" />
                    </button>
                    <div className="pl-1">
                      {expandedGroup === group.id ? (
                        <ChevronUp className="w-4 h-4 text-neutral-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-neutral-400" />
                      )}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedGroup === group.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-neutral-100 px-4 py-3 bg-neutral-50/50">
                        <div className="space-y-2 mb-3">
                          {group.options?.length === 0 && (
                            <p className="text-xs text-neutral-400 text-center py-3">
                              No options yet. Add the first one.
                            </p>
                          )}
                          <AnimatePresence>
                            {group.options?.map((option, optIdx) => (
                              <motion.div
                                key={option.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ delay: optIdx * 0.03 }}
                                className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-neutral-100"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 flex-shrink-0" />
                                  <span className="text-sm text-brand-black font-medium truncate">
                                    {option.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className={`text-xs font-semibold ${
                                    Number(option.priceAdjustment) > 0
                                      ? "text-brand-red"
                                      : Number(option.priceAdjustment) < 0
                                      ? "text-neutral-500"
                                      : "text-neutral-400"
                                  }`}>
                                    {Number(option.priceAdjustment) > 0
                                      ? `+${formatPrice(option.priceAdjustment)}`
                                      : Number(option.priceAdjustment) < 0
                                      ? formatPrice(option.priceAdjustment)
                                      : "No charge"}
                                  </span>
                                  <button
                                    onClick={() => openEditOption(group, option)}
                                    className="p-1 hover:bg-neutral-100 rounded transition-colors"
                                  >
                                    <Pencil className="w-3 h-3 text-neutral-400" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Delete option "${option.name}"?`)) {
                                        deleteOption.mutate({ custId: group.id, optId: option.id })
                                      }
                                    }}
                                    className="p-1 hover:bg-red-50 rounded transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3 text-brand-red" />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                        <button
                          onClick={() => openAddOption(group.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-brand-red hover:text-red-700 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Option
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <Modal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        title={editingGroup ? "Edit Customization Group" : "Add Customization Group"}
      >
        <form onSubmit={handleGroupSubmit} className="space-y-4">
          <Input
            label="Group Name"
            placeholder="e.g. Spice Level, Add-ons, Size"
            value={groupForm.name}
            onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium mb-1.5">Selection Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGroupForm({ ...groupForm, type: "SINGLE_SELECT" })}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                  groupForm.type === "SINGLE_SELECT"
                    ? "bg-brand-black text-white border-brand-black"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                }`}
              >
                {groupForm.type === "SINGLE_SELECT" && <Check className="w-3.5 h-3.5" />}
                Single Select
              </button>
              <button
                type="button"
                onClick={() => setGroupForm({ ...groupForm, type: "MULTI_SELECT" })}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                  groupForm.type === "MULTI_SELECT"
                    ? "bg-brand-black text-white border-brand-black"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                }`}
              >
                {groupForm.type === "MULTI_SELECT" && <Check className="w-3.5 h-3.5" />}
                Multi Select
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setGroupForm({ ...groupForm, isRequired: !groupForm.isRequired })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                groupForm.isRequired ? "bg-brand-red" : "bg-neutral-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  groupForm.isRequired ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <label className="text-sm font-medium text-brand-black">Required selection</label>
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setShowGroupModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={createGroup.isPending || updateGroup.isPending}
            >
              {editingGroup ? "Save Changes" : "Create Group"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showOptionModal}
        onClose={() => setShowOptionModal(false)}
        title={editingOption ? "Edit Option" : "Add Option"}
      >
        <form onSubmit={handleOptionSubmit} className="space-y-4">
          <Input
            label="Option Name"
            placeholder="e.g. Extra Spicy, Cheese, Large"
            value={optionForm.name}
            onChange={(e) => setOptionForm({ ...optionForm, name: e.target.value })}
            required
          />
          <Input
            label="Price Adjustment (₹)"
            type="number"
            step="0.01"
            placeholder="0 for no charge, positive to add, negative to subtract"
            value={optionForm.priceAdjustment}
            onChange={(e) => setOptionForm({ ...optionForm, priceAdjustment: e.target.value })}
          />
          <p className="text-xs text-neutral-400 -mt-2">
            Use 0 for no extra charge, +20 to add ₹20, -10 to subtract ₹10
          </p>
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setShowOptionModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={createOption.isPending || updateOption.isPending}
            >
              {editingOption ? "Save Changes" : "Add Option"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
