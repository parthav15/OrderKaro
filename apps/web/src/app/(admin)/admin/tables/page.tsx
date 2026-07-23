"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import api from "@/lib/api"
import { toast } from "sonner"

import { TablesHeader } from "./_components/TablesHeader"
import { Toolbar } from "./_components/Toolbar"
import { TableCard } from "./_components/TableCard"
import { TableListRow } from "./_components/TableListRow"
import { TableCardSkeleton } from "./_components/TableCardSkeleton"
import { SectionGroup } from "./_components/SectionGroup"
import { BulkActionBar } from "./_components/BulkActionBar"
import { AddTableModal } from "./_components/AddTableModal"
import { EditTableModal } from "./_components/EditTableModal"
import { QrPosterModal } from "./_components/QrPosterModal"
import { AnywhereQrCard } from "./_components/AnywhereQrCard"
import { EmptyState } from "./_components/EmptyState"
import { TableMapView } from "./_components/map/TableMapView"

import { useTablesQuery, type TableRow } from "./_hooks/useTablesQuery"
import { useTablesUrlState } from "./_hooks/useUrlState"
import { useBulkSelection } from "./_hooks/useBulkSelection"
import { useTablesRealtime } from "./_hooks/useTablesRealtime"
import { groupBySection, uniqueSections } from "./_utils/section-grouping"

type BulkQrItem = {
  table: string
  section: string | null
  qrDataUrl: string
  url: string
}

export default function TablesPage() {
  const queryClient = useQueryClient()
  const { state: urlState, update: updateUrlState } = useTablesUrlState()
  const [restaurantId, setRestaurantId] = useState<string>("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editTarget, setEditTarget] = useState<TableRow | null>(null)
  const [posterTarget, setPosterTarget] = useState<TableRow | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkExporting, setBulkExporting] = useState(false)
  const [bulkSelectionExporting, setBulkSelectionExporting] = useState(false)
  const [bulkToggling, setBulkToggling] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const { data: restaurants } = useQuery<{ id: string; name: string; slug: string }[]>({
    queryKey: ["restaurants"],
    queryFn: () => api.get("/api/v1/restaurants").then((r) => r.data.data),
  })

  const selectedRestaurant = restaurants?.find((c) => c.id === restaurantId)

  useEffect(() => {
    if (restaurants?.[0] && !restaurantId) setRestaurantId(restaurants[0].id)
  }, [restaurants, restaurantId])

  const { data: tables, isLoading } = useTablesQuery(restaurantId)
  const { activity } = useTablesRealtime(restaurantId)
  const selection = useBulkSelection()

  useEffect(() => {
    if (!tables) return
    const liveIds = new Set(tables.map((t) => t.id))
    const stale = selection.selectedIds.filter((id) => !liveIds.has(id))
    if (stale.length) selection.deselectMany(stale)
  }, [tables])

  const sections = useMemo(() => uniqueSections(tables ?? []), [tables])

  const filteredTables = useMemo(() => {
    if (!tables) return []
    let list = tables
    if (urlState.section) {
      list = list.filter((t) => (t.section ?? "") === urlState.section)
    }
    if (urlState.query.trim()) {
      const q = urlState.query.trim().toLowerCase()
      list = list.filter(
        (t) =>
          t.label.toLowerCase().includes(q) ||
          (t.section ?? "").toLowerCase().includes(q)
      )
    }
    if (urlState.sort === "recent") {
      list = [...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    } else if (urlState.sort === "active") {
      list = [...list].sort((a, b) => b.todayOrderCount - a.todayOrderCount)
    } else {
      list = [...list].sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { numeric: true })
      )
    }
    return list
  }, [tables, urlState])

  const grouped = useMemo(() => groupBySection(filteredTables), [filteredTables])
  const orderedIds = useMemo(() => filteredTables.map((t) => t.id), [filteredTables])

  const totalCount = tables?.length ?? 0
  const activeCount = (tables ?? []).filter((t) => t.isActive).length
  const liveNowCount = (tables ?? []).filter(
    (t) => (activity[t.id]?.activeOrderCount ?? t.activeOrderCount) > 0
  ).length

  const deleteOne = useMutation({
    mutationFn: (tableId: string) =>
      api.delete(`/api/v1/restaurants/${restaurantId}/tables/${tableId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables", restaurantId] })
      toast.success("Table deleted")
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Delete failed"),
  })

  async function fetchSingleQr(tableId: string) {
    const cached = queryClient.getQueryData<{ url: string; qrDataUrl: string }>([
      "table-qr",
      restaurantId,
      tableId,
    ])
    if (cached) return cached
    const { data } = await api.get(`/api/v1/restaurants/${restaurantId}/tables/${tableId}/qr`)
    queryClient.setQueryData(["table-qr", restaurantId, tableId], data.data)
    return data.data as { url: string; qrDataUrl: string }
  }

  async function downloadSingleQr(table: TableRow) {
    setDownloadingId(table.id)
    try {
      const qr = await fetchSingleQr(table.id)
      const link = document.createElement("a")
      link.href = qr.qrDataUrl
      link.download = `qr-${slugify(table.label)}.png`
      link.click()
    } catch {
      toast.error("Download failed")
    } finally {
      setDownloadingId(null)
    }
  }

  function handleToggleSelect(id: string, shiftKey: boolean) {
    if (shiftKey) selection.toggleRange(id, orderedIds)
    else selection.toggle(id)
  }

  async function downloadBulkPdf(targetIds?: string[]) {
    if (!restaurantId) return
    const isSelection = !!targetIds
    if (isSelection) setBulkSelectionExporting(true)
    else setBulkExporting(true)

    try {
      const { data } = await api.post(`/api/v1/restaurants/${restaurantId}/tables/bulk-qr`)
      let qrItems: BulkQrItem[] = data.data
      if (targetIds) {
        const labelSet = new Set(
          (tables ?? [])
            .filter((t) => targetIds.includes(t.id))
            .map((t) => t.label)
        )
        qrItems = qrItems.filter((q) => labelSet.has(q.table))
      }
      if (!qrItems.length) {
        toast.error("No active tables found")
        return
      }
      await renderQrPdf(qrItems, restaurants?.find((c) => c.id === restaurantId)?.name ?? "Restaurant")
      toast.success("QR sheet downloaded")
      if (isSelection) selection.clear()
    } catch {
      toast.error("Failed to generate PDF")
    } finally {
      if (isSelection) setBulkSelectionExporting(false)
      else setBulkExporting(false)
    }
  }

  async function bulkToggleActive() {
    if (!tables) return
    setBulkToggling(true)
    try {
      const targetTables = tables.filter((t) => selection.selected.has(t.id))
      const allActive = targetTables.every((t) => t.isActive)
      const next = !allActive
      await Promise.all(
        targetTables.map((t) =>
          api.put(`/api/v1/restaurants/${restaurantId}/tables/${t.id}`, { isActive: next })
        )
      )
      queryClient.invalidateQueries({ queryKey: ["tables", restaurantId] })
      toast.success(next ? "Tables activated" : "Tables deactivated")
      selection.clear()
    } catch {
      toast.error("Bulk toggle failed")
    } finally {
      setBulkToggling(false)
    }
  }

  async function bulkDelete() {
    try {
      await Promise.all(
        selection.selectedIds.map((id) =>
          api.delete(`/api/v1/restaurants/${restaurantId}/tables/${id}`)
        )
      )
      queryClient.invalidateQueries({ queryKey: ["tables", restaurantId] })
      toast.success(`Deleted ${selection.count} table${selection.count === 1 ? "" : "s"}`)
      selection.clear()
      setBulkDeleteOpen(false)
    } catch {
      toast.error("Some tables could not be deleted")
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return
      if (e.key === "Escape" && selection.count > 0) {
        e.preventDefault()
        selection.clear()
      }
      if (e.key === "Delete" && selection.count > 0) {
        e.preventDefault()
        setBulkDeleteOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selection])

  const showLoading = isLoading || !tables
  const isEmpty = tables && tables.length === 0
  const isFilteredEmpty = tables && tables.length > 0 && filteredTables.length === 0
  const isMapView = urlState.view === "map"
  const [mapSelectedId, setMapSelectedId] = useState<string | null>(null)

  return (
    <LayoutGroup>
      <TablesHeader
        restaurants={restaurants ?? []}
        restaurantId={restaurantId}
        onRestaurantChange={setRestaurantId}
        total={totalCount}
        active={activeCount}
        liveNow={liveNowCount}
        onAdd={() => setShowAddModal(true)}
        onBulkDownload={() => downloadBulkPdf()}
        bulkExporting={bulkExporting}
        hasTables={!!tables?.length}
      />

      <AnywhereQrCard
        slug={selectedRestaurant?.slug ?? null}
        restaurantName={selectedRestaurant?.name ?? "Restaurant"}
      />

      {!isEmpty && (
        <Toolbar
          query={urlState.query}
          onQueryChange={(q) => updateUrlState({ query: q })}
          sections={sections}
          activeSection={urlState.section}
          onSectionChange={(s) => updateUrlState({ section: s })}
          sort={urlState.sort}
          onSortChange={(s) => updateUrlState({ sort: s })}
          view={urlState.view}
          onViewChange={(v) => updateUrlState({ view: v })}
        />
      )}

      {showLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <TableCardSkeleton key={i} />
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState
          onAdd={() => setShowAddModal(true)}
          onBulkAdd={() => setShowAddModal(true)}
        />
      ) : isMapView ? (
        <TableMapView
          tables={filteredTables}
          restaurantId={restaurantId}
          activity={activity}
          onSelectTable={setMapSelectedId}
          selectedTableId={mapSelectedId}
        />
      ) : isFilteredEmpty ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <p className="text-sm font-bold text-ink mb-1">No tables match</p>
          <p className="text-sm text-muted">
            Try a different search term or section.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-10">
          {grouped.map((group) => {
            const groupIds = group.items.map((t) => t.id)
            const groupSelected = groupIds.filter((id) => selection.selected.has(id)).length
            return (
              <SectionGroup
                key={group.section}
                title={group.displaySection}
                count={group.items.length}
                selectedCount={groupSelected}
                onSelectAll={() => selection.selectMany(groupIds)}
                onClearAll={() => selection.deselectMany(groupIds)}
              >
                {urlState.view === "grid" ? (
                  <motion.div
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                  >
                    <AnimatePresence>
                      {group.items.map((table, idx) => (
                        <motion.div
                          key={table.id}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ delay: idx * 0.04, type: "spring", stiffness: 280, damping: 26 }}
                        >
                          <TableCard
                            table={table}
                            restaurantId={restaurantId}
                            selected={selection.isSelected(table.id)}
                            selectionMode={selection.count > 0}
                            onToggleSelect={handleToggleSelect}
                            onView={(t) => setPosterTarget(t)}
                            onEdit={(t) => setEditTarget(t)}
                            onDownload={(t) => downloadSingleQr(t)}
                            onDelete={(t) => deleteOne.mutate(t.id)}
                            isDownloading={downloadingId === table.id}
                            pulseAt={activity[table.id]?.pulseAt}
                            liveActiveCount={activity[table.id]?.activeOrderCount}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div layout className="rounded-2xl border border-line bg-surface p-2">
                    <div className="grid grid-cols-[24px_60px_1fr_140px_120px_140px_180px] items-center gap-4 px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] font-bold text-muted">
                      <span />
                      <span>Code</span>
                      <span>Label</span>
                      <span>Status</span>
                      <span>Today</span>
                      <span>State</span>
                      <span className="text-right">Actions</span>
                    </div>
                    <div className="space-y-1">
                      <AnimatePresence>
                        {group.items.map((table) => (
                          <TableListRow
                            key={table.id}
                            table={table}
                            restaurantId={restaurantId}
                            selected={selection.isSelected(table.id)}
                            onToggleSelect={handleToggleSelect}
                            onView={(t) => setPosterTarget(t)}
                            onEdit={(t) => setEditTarget(t)}
                            onDownload={(t) => downloadSingleQr(t)}
                            onDelete={(t) => deleteOne.mutate(t.id)}
                            isDownloading={downloadingId === table.id}
                            pulseAt={activity[table.id]?.pulseAt}
                            liveActiveCount={activity[table.id]?.activeOrderCount}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </SectionGroup>
            )
          })}
        </div>
      )}

      <BulkActionBar
        count={selection.count}
        onClear={selection.clear}
        onDownload={() => downloadBulkPdf(selection.selectedIds)}
        onToggleActive={bulkToggleActive}
        onDelete={() => setBulkDeleteOpen(true)}
        downloading={bulkSelectionExporting}
        toggling={bulkToggling}
      />

      <AddTableModal
        isOpen={showAddModal}
        restaurantId={restaurantId}
        sections={sections}
        onClose={() => setShowAddModal(false)}
      />

      <EditTableModal
        table={editTarget}
        restaurantId={restaurantId}
        sections={sections}
        onClose={() => setEditTarget(null)}
      />

      <QrPosterModal
        table={posterTarget}
        restaurantId={restaurantId}
        restaurantName={restaurants?.find((c) => c.id === restaurantId)?.name ?? "Restaurant"}
        onClose={() => setPosterTarget(null)}
      />

      <Modal isOpen={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)} title="Delete tables">
        <div className="space-y-5">
          <div className="flex items-start gap-4 p-4 bg-primary/10 border border-brand-red/20 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-brand-red flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-ink">
                Delete {selection.count} table{selection.count === 1 ? "" : "s"}?
              </p>
              <p className="text-sm text-muted mt-1">
                Their QR codes will stop working. Existing orders are unaffected.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button size="lg" variant="outline" className="flex-1" onClick={() => setBulkDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              size="lg"
              variant="danger"
              className="flex-1"
              onClick={bulkDelete}
            >
              <Trash2 className="w-4 h-4" /> Delete {selection.count}
            </Button>
          </div>
        </div>
      </Modal>
    </LayoutGroup>
  )
}

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

async function renderQrPdf(qrItems: BulkQrItem[], restaurantName: string) {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 16
  const colCount = 2
  const colGap = 8
  const qrSize = 60
  const labelHeight = 10
  const rowHeight = qrSize + labelHeight + 14
  const colWidth = (pageWidth - margin * 2 - colGap * (colCount - 1)) / colCount

  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.setTextColor(220, 38, 38)
  doc.text("Vision Menu", margin, margin + 6)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(10, 10, 10)
  doc.text(restaurantName, margin, margin + 13)

  doc.setDrawColor(220, 38, 38)
  doc.setLineWidth(0.5)
  doc.line(margin, margin + 17, pageWidth - margin, margin + 17)

  const contentStartY = margin + 24

  for (let i = 0; i < qrItems.length; i++) {
    const item = qrItems[i]
    const col = i % colCount
    const row = Math.floor(i / colCount)
    const x = margin + col * (colWidth + colGap)
    const y = contentStartY + row * rowHeight

    if (y + rowHeight > pageHeight - margin) {
      doc.addPage()
    }

    const renderY = y + rowHeight > pageHeight - margin ? contentStartY : y
    const cardX = x
    const cardY = renderY
    const cardW = colWidth
    const cardH = rowHeight - 6

    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(230, 230, 230)
    doc.setLineWidth(0.3)
    doc.roundedRect(cardX, cardY, cardW, cardH, 3, 3, "FD")

    const qrX = cardX + (cardW - qrSize) / 2
    const qrY = cardY + 6
    doc.addImage(item.qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(10, 10, 10)
    doc.text(item.table, cardX + cardW / 2, qrY + qrSize + 6, { align: "center" })

    if (item.section) {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      doc.setTextColor(120, 120, 120)
      doc.text(item.section, cardX + cardW / 2, qrY + qrSize + 11, { align: "center" })
    }
  }

  const safeFileName = restaurantName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
  doc.save(`qr-codes-${safeFileName}.pdf`)
}
