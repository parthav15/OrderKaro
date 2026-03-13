"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, QrCode, Download, Trash2, FileDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

        const renderY = y + rowHeight > pageHeight - margin
          ? contentStartY
          : y

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-brand-black">Tables & QR Codes</h1>
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -1 }}
            onClick={downloadBulkQrPdf}
            disabled={bulkExporting || !canteenId}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white text-brand-black border border-neutral-300 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            <AnimatePresence mode="wait">
              {bulkExporting ? (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </motion.span>
              ) : (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  Download QR Sheet
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" /> Add Table
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables?.map((table: any, idx: number) => (
          <motion.div
            key={table.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card>
              <CardContent className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{table.label}</h3>
                  {table.section && (
                    <p className="text-sm text-neutral-500">{table.section}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    whileHover={{ y: -1 }}
                    onClick={() => viewQr(table.id)}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <QrCode className="w-5 h-5 text-brand-black" />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    whileHover={{ y: -1 }}
                    onClick={() => downloadSingleQr(table.id, table.label)}
                    disabled={downloadingTableId === table.id}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <AnimatePresence mode="wait">
                      {downloadingTableId === table.id ? (
                        <motion.span
                          key="spin"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <Loader2 className="w-5 h-5 animate-spin text-brand-black" />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="dl"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <Download className="w-5 h-5 text-brand-black" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    whileHover={{ y: -1 }}
                    onClick={() => deleteTable.mutate(table.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors text-neutral-400 hover:text-brand-red"
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Table">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createTable.mutate({
              label: form.label,
              section: form.section || undefined,
            })
          }}
          className="space-y-4"
        >
          <Input
            label="Table Label"
            placeholder="Table 1"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            required
          />
          <Input
            label="Section (optional)"
            placeholder="Ground Floor"
            value={form.section}
            onChange={(e) => setForm({ ...form, section: e.target.value })}
          />
          <Button type="submit" className="w-full" loading={createTable.isPending}>
            Create Table
          </Button>
        </form>
      </Modal>

      <Modal isOpen={!!showQr} onClose={() => setShowQr(null)} title="QR Code">
        {showQr && (
          <div className="text-center space-y-4">
            <img src={showQr.qrDataUrl} alt="QR Code" className="w-64 h-64 mx-auto" />
            <p className="font-bold">{showQr.table?.label}</p>
            <p className="text-sm text-neutral-500 break-all">{showQr.url}</p>
            <a href={showQr.qrDataUrl} download={`qr-${showQr.table?.label}.png`}>
              <Button variant="outline" className="w-full">
                <Download className="w-4 h-4" /> Download QR
              </Button>
            </a>
          </div>
        )}
      </Modal>
    </div>
  )
}
