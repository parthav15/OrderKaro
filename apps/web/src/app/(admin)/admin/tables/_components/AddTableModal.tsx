"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, QrCode, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import api from "@/lib/api"
import { toast } from "sonner"
import { Switch } from "./Switch"

interface AddTableModalProps {
  isOpen: boolean
  canteenId: string
  sections: string[]
  onClose: () => void
}

export function AddTableModal({ isOpen, canteenId, sections, onClose }: AddTableModalProps) {
  const queryClient = useQueryClient()
  const [bulkMode, setBulkMode] = useState(false)
  const [label, setLabel] = useState("")
  const [section, setSection] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [bulkPrefix, setBulkPrefix] = useState("Table")
  const [bulkFrom, setBulkFrom] = useState(1)
  const [bulkTo, setBulkTo] = useState(10)
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 })

  useEffect(() => {
    if (!isOpen) {
      setBulkMode(false)
      setLabel("")
      setSection("")
      setBulkPrefix("Table")
      setBulkFrom(1)
      setBulkTo(10)
      setBulkProgress({ done: 0, total: 0 })
    }
  }, [isOpen])

  const createOne = useMutation({
    mutationFn: (data: { label: string; section?: string }) =>
      api.post(`/api/v1/canteens/${canteenId}/tables`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables", canteenId] })
      toast.success("Table created")
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  })

  const previewCount = Math.max(0, bulkTo - bulkFrom + 1)
  const previewItems = useMemo(() => {
    const items: string[] = []
    for (let i = bulkFrom; i <= Math.min(bulkTo, bulkFrom + 4); i++) {
      items.push(`${bulkPrefix} ${i}`)
    }
    return items
  }, [bulkPrefix, bulkFrom, bulkTo])

  async function runBulkCreate() {
    if (bulkTo < bulkFrom || previewCount > 200) {
      toast.error("Please pick a valid range (max 200)")
      return
    }
    setBulkProgress({ done: 0, total: previewCount })
    let success = 0
    let failed = 0
    for (let i = bulkFrom; i <= bulkTo; i++) {
      try {
        await api.post(`/api/v1/canteens/${canteenId}/tables`, {
          label: `${bulkPrefix} ${i}`,
          section: section.trim() || undefined,
        })
        success++
      } catch {
        failed++
      }
      setBulkProgress({ done: success + failed, total: previewCount })
    }
    queryClient.invalidateQueries({ queryKey: ["tables", canteenId] })
    if (failed === 0) {
      toast.success(`Created ${success} tables`)
    } else {
      toast.error(`Created ${success}, skipped ${failed} (likely duplicates)`)
    }
    onClose()
  }

  const filteredSuggestions = sections.filter(
    (s) => s.toLowerCase().includes(section.toLowerCase()) && s !== section
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add tables" className="max-w-2xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 border border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-neutral-200 flex items-center justify-center">
              <Layers className="w-4 h-4 text-neutral-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-brand-black">Create multiple at once</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Generate a numbered range like Table 1 → Table 20.
              </p>
            </div>
          </div>
          <Switch checked={bulkMode} onCheckedChange={setBulkMode} ariaLabel="Bulk mode" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-6">
          <div className="space-y-5">
            <AnimatePresence mode="wait" initial={false}>
              {!bulkMode ? (
                <motion.form
                  key="single"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  onSubmit={(e) => {
                    e.preventDefault()
                    createOne.mutate({
                      label: label.trim(),
                      section: section.trim() || undefined,
                    })
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-brand-black">Label</label>
                    <input
                      autoFocus
                      placeholder="e.g. Table 1, Corner Table"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      required
                      className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-colors"
                    />
                  </div>

                  <SectionField
                    section={section}
                    setSection={setSection}
                    show={showSuggestions}
                    setShow={setShowSuggestions}
                    suggestions={filteredSuggestions}
                  />

                  <Button type="submit" size="lg" className="w-full" loading={createOne.isPending}>
                    <Plus className="w-4 h-4" /> Create table
                  </Button>
                </motion.form>
              ) : (
                <motion.div
                  key="bulk"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-brand-black">Label prefix</label>
                    <input
                      value={bulkPrefix}
                      onChange={(e) => setBulkPrefix(e.target.value)}
                      className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-brand-black">From</label>
                      <input
                        type="number"
                        min={1}
                        value={bulkFrom}
                        onChange={(e) => setBulkFrom(parseInt(e.target.value || "1"))}
                        className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-brand-black">To</label>
                      <input
                        type="number"
                        min={bulkFrom}
                        value={bulkTo}
                        onChange={(e) => setBulkTo(parseInt(e.target.value || `${bulkFrom}`))}
                        className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-colors"
                      />
                    </div>
                  </div>

                  <SectionField
                    section={section}
                    setSection={setSection}
                    show={showSuggestions}
                    setShow={setShowSuggestions}
                    suggestions={filteredSuggestions}
                  />

                  {bulkProgress.total > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-brand-black">Creating tables…</span>
                        <span className="tabular-nums text-neutral-500">
                          {bulkProgress.done} / {bulkProgress.total}
                        </span>
                      </div>
                      <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-brand-red"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(bulkProgress.done / bulkProgress.total) * 100}%`,
                          }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={runBulkCreate}
                    size="lg"
                    className="w-full"
                    loading={bulkProgress.total > 0 && bulkProgress.done < bulkProgress.total}
                    disabled={previewCount === 0}
                  >
                    <Plus className="w-4 h-4" />
                    Create {previewCount} table{previewCount === 1 ? "" : "s"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <PreviewPanel
            bulkMode={bulkMode}
            label={label}
            section={section}
            previewItems={previewItems}
            count={previewCount}
          />
        </div>
      </div>
    </Modal>
  )
}

function SectionField({
  section,
  setSection,
  show,
  setShow,
  suggestions,
}: {
  section: string
  setSection: (s: string) => void
  show: boolean
  setShow: (v: boolean) => void
  suggestions: string[]
}) {
  return (
    <div className="space-y-2 relative">
      <label className="block text-sm font-bold text-brand-black">
        Section <span className="font-normal text-neutral-400">(optional)</span>
      </label>
      <input
        value={section}
        onChange={(e) => {
          setSection(e.target.value)
          setShow(true)
        }}
        onFocus={() => setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 120)}
        placeholder="e.g. Ground Floor, Terrace"
        className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-colors"
      />
      {show && suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-10 mt-1 w-full rounded-xl border border-neutral-200 bg-white shadow-lg overflow-hidden"
        >
          {suggestions.slice(0, 5).map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                setSection(s)
                setShow(false)
              }}
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-50 transition-colors"
            >
              {s}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  )
}

function PreviewPanel({
  bulkMode,
  label,
  section,
  previewItems,
  count,
}: {
  bulkMode: boolean
  label: string
  section: string
  previewItems: string[]
  count: number
}) {
  const list = bulkMode ? previewItems : [label || "Table"]
  return (
    <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/40 p-4 space-y-3">
      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-neutral-400">
        Live preview
      </p>
      <div className="space-y-2">
        {list.map((item, idx) => (
          <motion.div
            key={item + idx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-white border border-neutral-100"
          >
            <div className="w-10 h-10 rounded-lg bg-neutral-50 flex items-center justify-center ring-1 ring-inset ring-neutral-100">
              <QrCode className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-brand-black truncate">{item}</p>
              {section && (
                <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-400 mt-0.5 truncate">
                  {section}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      {bulkMode && count > 5 && (
        <p className="text-xs text-neutral-400 text-center pt-1">
          +{count - 5} more
        </p>
      )}
    </div>
  )
}
