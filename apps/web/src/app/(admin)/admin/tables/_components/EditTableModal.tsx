"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import api from "@/lib/api"
import { toast } from "sonner"
import type { TableRow } from "../_hooks/useTablesQuery"
import { Switch } from "./Switch"

interface EditTableModalProps {
  table: TableRow | null
  restaurantId: string
  sections: string[]
  onClose: () => void
}

export function EditTableModal({ table, restaurantId, sections, onClose }: EditTableModalProps) {
  const queryClient = useQueryClient()
  const [label, setLabel] = useState("")
  const [section, setSection] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    if (table) {
      setLabel(table.label)
      setSection(table.section ?? "")
      setIsActive(table.isActive)
    }
  }, [table])

  const update = useMutation({
    mutationFn: (payload: { label: string; section?: string; isActive: boolean }) =>
      api.put(`/api/v1/restaurants/${restaurantId}/tables/${table!.id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables", restaurantId] })
      toast.success("Table updated")
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to update"),
  })

  const filteredSuggestions = sections.filter(
    (s) => s.toLowerCase().includes(section.toLowerCase()) && s !== section
  )

  return (
    <Modal isOpen={!!table} onClose={onClose} title="Edit table">
      {table && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            update.mutate({
              label: label.trim(),
              section: section.trim() || undefined,
              isActive,
            })
          }}
          className="space-y-5"
        >
          <div className="space-y-2">
            <label className="block text-sm font-bold text-ink">Label</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-colors"
            />
          </div>

          <div className="space-y-2 relative">
            <label className="block text-sm font-bold text-ink">
              Section <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              value={section}
              onChange={(e) => {
                setSection(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
              placeholder="e.g. Ground Floor"
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-colors"
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute z-10 mt-1 w-full rounded-xl border border-line bg-surface shadow-lg overflow-hidden"
              >
                {filteredSuggestions.slice(0, 5).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setSection(s)
                      setShowSuggestions(false)
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-surface-elevated transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-elevated border border-line">
            <div>
              <p className="text-sm font-bold text-ink">Active</p>
              <p className="text-xs text-muted mt-0.5">
                Inactive tables are hidden from QR scans.
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              ariaLabel="Toggle table active state"
            />
          </div>

          <Button type="submit" size="lg" className="w-full" loading={update.isPending}>
            <Save className="w-4 h-4" /> Save changes
          </Button>
        </form>
      )}
    </Modal>
  )
}
