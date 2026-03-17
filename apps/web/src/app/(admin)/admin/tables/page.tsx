"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, QrCode, Download, Trash2, FileDown, Loader2, LayoutGrid, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import api from "@/lib/api"
import { toast } from "sonner"

type BulkQrItem = {
  table: string
  section: string | null
  qrDataUrl: string
  url: string
}

export default function TableManagement() {
  const queryClient = useQueryClient()
  const [canteenId, setCanteenId] = useState<string>("")
  const [showModal, setShowModal] = useState(false)
  const [showQr, setShowQr] = useState<any>(null)
  const [form, setForm] = useState({ label: "", section: "" })
  const [bulkExporting, setBulkExporting] = useState(false)
  const [downloadingTableId, setDownloadingTableId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)

  const { data: canteens } = useQuery({
    queryKey: ["canteens"],
    queryFn: () => api.get("/api/v1/canteens").then((r) => r.data.data),
  })

  useEffect(() => {
    if (canteens?.[0] && !canteenId) {
      setCanteenId(canteens[0].id)
    }
  }, [canteens, canteenId])

  const { data: tables } = useQuery({
    queryKey: ["tables", canteenId],
    queryFn: () => api.get(`/api/v1/canteens/${canteenId}/tables`).then((r) => r.data.data),
    enabled: !!canteenId,
  })

  const createTable = useMutation({
    mutationFn: (data: any) => api.post(`/api/v1/canteens/${canteenId}/tables`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] })
      setShowModal(false)
      setForm({ label: "", section: "" })
      toast.success("Table created")
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  })

  const deleteTable = useMutation({
    mutationFn: (tableId: string) =>
      api.delete(`/api/v1/canteens/${canteenId}/tables/${tableId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] })
      setDeleteTarget(null)
      toast.success("Table deleted")
    },
  })

  async function viewQr(tableId: string) {
    const { data } = await api.get(`/api/v1/canteens/${canteenId}/tables/${tableId}/qr`)
    setShowQr(data.data)
  }

  async function downloadSingleQr(tableId: string, tableLabel: string) {
    setDownloadingTableId(tableId)
    try {
      const { data } = await api.get(`/api/v1/canteens/${canteenId}/tables/${tableId}/qr`)
      const link = document.createElement("a")
      link.href = data.data.qrDataUrl
      link.download = `qr-${tableLabel.toLowerCase().replace(/\s+/g, "-")}.png`
      link.click()
    } catch {
      toast.error("Failed to download QR code")
    } finally {
      setDownloadingTableId(null)
    }
  }

  async function downloadBulkQrPdf() {
    if (!canteenId) return
    setBulkExporting(true)
    try {
      const { data } = await api.post(`/api/v1/canteens/${canteenId}/tables/bulk-qr`)
      const qrItems: BulkQrItem[] = data.data

      if (!qrItems.length) {
        toast.error("No active tables found")
        return
      }

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

      const canteenName = canteens?.find((c: any) => c.id === canteenId)?.name ?? "Canteen"

      doc.setFont("helvetica", "bold")
      doc.setFontSize(20)
      doc.setTextColor(220, 38, 38)
      doc.text("OrderKaro", margin, margin + 6)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.setTextColor(10, 10, 10)
      doc.text(canteenName, margin, margin + 13)

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

      const safeFileName = canteenName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
      doc.save(`qr-codes-${safeFileName}.pdf`)
      toast.success("QR sheet downloaded")
    } catch {
      toast.error("Failed to generate PDF")
    } finally {
      setBulkExporting(false)
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 text-brand-red" />
            </div>
            <h1 className="text-3xl font-extrabold text-brand-black">Tables & QR Codes</h1>
          </div>
          <p className="text-neutral-500">
            {tables?.length ? `${tables.length} table${tables.length !== 1 ? "s" : ""} configured` : "Add tables and print QR codes for customers to scan"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canteens && canteens.length > 1 && (
            <select
              value={canteenId}
              onChange={(e) => setCanteenId(e.target.value)}
              className="px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-brand-red"
            >
              {canteens.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -1 }}
            onClick={downloadBulkQrPdf}
            disabled={bulkExporting || !canteenId || !tables?.length}
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold rounded-xl bg-white text-brand-black border-2 border-neutral-300 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            <AnimatePresence mode="wait">
              {bulkExporting ? (
                <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Generating PDF...
                </motion.span>
              ) : (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <FileDown className="w-5 h-5" /> Download All QR Codes
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <Button size="lg" onClick={() => setShowModal(true)}>
            <Plus className="w-5 h-5" /> Add Table
          </Button>
        </div>
      </div>

      {!tables && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-neutral-100 animate-pulse" />
          ))}
        </div>
      )}

      {tables && tables.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 border-2 border-dashed border-neutral-200 rounded-2xl"
        >
          <LayoutGrid className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-brand-black mb-2">No tables yet</h3>
          <p className="text-neutral-400 mb-6">Add tables so customers can scan QR codes to place orders</p>
          <Button size="lg" onClick={() => setShowModal(true)}>
            <Plus className="w-5 h-5" /> Add First Table
          </Button>
        </motion.div>
      )}

      {tables && tables.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((table: any, idx: number) => (
            <motion.div
              key={table.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card>
                <CardContent className="py-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-extrabold text-brand-black">{table.label}</h3>
                      {table.section && (
                        <p className="text-sm text-neutral-500 mt-0.5">{table.section}</p>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                      <QrCode className="w-5 h-5 text-neutral-600" />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.93 }}
                      whileHover={{ y: -1 }}
                      onClick={() => viewQr(table.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-brand-black hover:bg-neutral-50 transition-colors"
                    >
                      <QrCode className="w-4 h-4" /> View QR
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.93 }}
                      whileHover={{ y: -1 }}
                      onClick={() => downloadSingleQr(table.id, table.label)}
                      disabled={downloadingTableId === table.id}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-brand-black hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <AnimatePresence mode="wait">
                        {downloadingTableId === table.id ? (
                          <motion.span key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Downloading...
                          </motion.span>
                        ) : (
                          <motion.span key="dl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                            <Download className="w-4 h-4" /> Download
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.93 }}
                      whileHover={{ y: -1 }}
                      onClick={() => setDeleteTarget(table)}
                      className="p-2.5 rounded-xl border border-brand-red/30 text-brand-red hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Table">
        {deleteTarget && (
          <div className="space-y-5">
            <div className="flex items-start gap-4 p-4 bg-red-50 border border-brand-red/20 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-brand-red flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-brand-black">Delete "{deleteTarget.label}"?</p>
                <p className="text-sm text-neutral-600 mt-1">
                  The QR code for this table will stop working. Existing orders will not be affected.
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
                loading={deleteTable.isPending}
                onClick={() => deleteTable.mutate(deleteTarget.id)}
              >
                <Trash2 className="w-4 h-4" /> Delete Table
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setForm({ label: "", section: "" }) }} title="Add New Table">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createTable.mutate({ label: form.label, section: form.section || undefined })
          }}
          className="space-y-5"
        >
          <div className="space-y-2">
            <label className="block text-sm font-bold text-brand-black">Table Name or Number</label>
            <input
              placeholder="e.g. Table 1, Corner Table, Terrace A"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              required
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-brand-black placeholder:text-neutral-400 transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-brand-black">Section <span className="font-normal text-neutral-400">(optional)</span></label>
            <input
              placeholder="e.g. Ground Floor, Outdoor, Hall B"
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-brand-black placeholder:text-neutral-400 transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
            />
          </div>
          <Button type="submit" size="lg" className="w-full" loading={createTable.isPending}>
            <Plus className="w-5 h-5" /> Create Table
          </Button>
        </form>
      </Modal>

      <Modal isOpen={!!showQr} onClose={() => setShowQr(null)} title={showQr?.table?.label ? `QR Code — ${showQr.table.label}` : "QR Code"}>
        {showQr && (
          <div className="text-center space-y-5">
            <div className="bg-neutral-50 rounded-2xl p-6 inline-block">
              <img src={showQr.qrDataUrl} alt="QR Code" className="w-64 h-64 mx-auto" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-brand-black">{showQr.table?.label}</p>
              <p className="text-sm text-neutral-400 break-all mt-1">{showQr.url}</p>
            </div>
            <p className="text-sm text-neutral-500">Print this QR code and place it on the table. Customers scan it to order.</p>
            <a href={showQr.qrDataUrl} download={`qr-${showQr.table?.label}.png`} className="block">
              <Button size="lg" variant="outline" className="w-full">
                <Download className="w-5 h-5" /> Download QR Code Image
              </Button>
            </a>
          </div>
        )}
      </Modal>
    </div>
  )
}
