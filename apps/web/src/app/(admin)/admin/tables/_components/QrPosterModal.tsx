"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, Check, Download, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { useQrThumb } from "../_hooks/useQrThumb"
import type { TableRow } from "../_hooks/useTablesQuery"

interface QrPosterModalProps {
  table: TableRow | null
  canteenId: string
  canteenName: string
  onClose: () => void
}

type Tab = "code" | "poster" | "link"

export function QrPosterModal({ table, canteenId, canteenName, onClose }: QrPosterModalProps) {
  const [tab, setTab] = useState<Tab>("code")
  const [copied, setCopied] = useState(false)
  const [posterUrl, setPosterUrl] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { data } = useQrThumb(canteenId, table?.id ?? null)

  useEffect(() => {
    if (!table) {
      setTab("code")
      setCopied(false)
      setPosterUrl(null)
    }
  }, [table])

  useEffect(() => {
    if (!data || !table) return
    if (tab !== "poster") return
    drawPoster(data.qrDataUrl, canteenName, table.label, table.section ?? null).then(setPosterUrl)
  }, [data, table, canteenName, tab])

  function copyUrl() {
    if (!data?.url) return
    navigator.clipboard.writeText(data.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  function downloadCode() {
    if (!data?.qrDataUrl || !table) return
    const link = document.createElement("a")
    link.href = data.qrDataUrl
    link.download = `qr-${slugify(table.label)}.png`
    link.click()
  }

  function downloadPoster() {
    if (!posterUrl || !table) return
    const link = document.createElement("a")
    link.href = posterUrl
    link.download = `poster-${slugify(table.label)}.png`
    link.click()
  }

  return (
    <Modal isOpen={!!table} onClose={onClose} title={table ? `${table.label} · QR` : "QR"}>
      {table && data && (
        <div className="space-y-5">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-100">
            {(["code", "poster", "link"] as Tab[]).map((key) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={
                  "flex-1 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-[0.18em] transition-colors " +
                  (tab === key
                    ? "bg-white text-brand-black shadow-sm"
                    : "text-neutral-500 hover:text-brand-black")
                }
              >
                {key}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "code" && (
              <motion.div
                key="code"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-4"
              >
                <div className="bg-neutral-50 rounded-2xl p-6 flex items-center justify-center">
                  <img src={data.qrDataUrl} alt="QR Code" className="w-64 h-64" />
                </div>
                <Button size="lg" variant="outline" className="w-full" onClick={downloadCode}>
                  <Download className="w-4 h-4" /> Download PNG
                </Button>
              </motion.div>
            )}

            {tab === "poster" && (
              <motion.div
                key="poster"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-4"
              >
                <div className="bg-neutral-50 rounded-2xl p-4 flex items-center justify-center">
                  {posterUrl ? (
                    <motion.img
                      key={posterUrl}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={posterUrl}
                      alt="Poster preview"
                      className="rounded-xl shadow-lg"
                      style={{ width: 200, height: 356 }}
                    />
                  ) : (
                    <div className="w-[200px] h-[356px] rounded-xl bg-neutral-100 animate-pulse" />
                  )}
                </div>
                <Button size="lg" className="w-full" onClick={downloadPoster} disabled={!posterUrl}>
                  <Download className="w-4 h-4" /> Download poster (1080×1920)
                </Button>
                <canvas ref={canvasRef} className="hidden" />
              </motion.div>
            )}

            {tab === "link" && (
              <motion.div
                key="link"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-2xl border border-neutral-100 bg-neutral-50">
                  <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-neutral-400 mb-1.5">
                    Direct URL
                  </p>
                  <p className="text-sm text-brand-black break-all">{data.url}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="lg" variant="outline" className="flex-1" onClick={copyUrl}>
                    <AnimatePresence mode="wait" initial={false}>
                      {copied ? (
                        <motion.span
                          key="copied"
                          initial={{ opacity: 0, rotate: -10 }}
                          animate={{ opacity: 1, rotate: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <Check className="w-4 h-4 text-brand-red" /> Copied
                        </motion.span>
                      ) : (
                        <motion.span
                          key="copy"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" /> Copy URL
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                  <a
                    href={data.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button size="lg" variant="outline" className="w-full">
                      <ExternalLink className="w-4 h-4" /> Open
                    </Button>
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </Modal>
  )
}

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

function drawPoster(
  qrDataUrl: string,
  canteenName: string,
  tableLabel: string,
  section: string | null
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas")
    canvas.width = 1080
    canvas.height = 1920
    const ctx = canvas.getContext("2d")
    if (!ctx) return resolve("")

    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, 1080, 1920)

    ctx.fillStyle = "#DC2626"
    ctx.fillRect(60, 60, 16, 80)

    ctx.fillStyle = "#0A0A0A"
    ctx.font = "800 60px DM Sans, system-ui, sans-serif"
    ctx.textBaseline = "top"
    ctx.fillText("OrderKaro", 100, 70)

    ctx.fillStyle = "#737373"
    ctx.font = "500 28px DM Sans, system-ui, sans-serif"
    ctx.fillText(canteenName, 100, 144)

    ctx.fillStyle = "#0A0A0A"
    ctx.font = "800 110px Instrument Sans, DM Sans, system-ui, sans-serif"
    ctx.textAlign = "center"
    ctx.fillText("Scan to Order", 540, 320)

    ctx.fillStyle = "#737373"
    ctx.font = "500 32px DM Sans, system-ui, sans-serif"
    ctx.fillText("No queue. No wait. Just scan.", 540, 460)

    const img = new Image()
    img.onload = () => {
      const qrSize = 700
      const qrX = (1080 - qrSize) / 2
      const qrY = 600

      ctx.fillStyle = "#FFFFFF"
      ctx.strokeStyle = "#0A0A0A"
      ctx.lineWidth = 2
      ctx.fillRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 48)

      ctx.drawImage(img, qrX, qrY, qrSize, qrSize)

      ctx.fillStyle = "#0A0A0A"
      ctx.font = "800 88px Instrument Sans, DM Sans, system-ui, sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(tableLabel, 540, 1430)

      if (section) {
        ctx.fillStyle = "#A3A3A3"
        ctx.font = "700 28px DM Sans, system-ui, sans-serif"
        const upper = section.toUpperCase()
        ctx.fillText(spreadLetters(upper), 540, 1540)
      }

      ctx.fillStyle = "#DC2626"
      ctx.fillRect(60, 1820, 960, 4)

      ctx.fillStyle = "#737373"
      ctx.font = "500 24px DM Sans, system-ui, sans-serif"
      ctx.textAlign = "left"
      ctx.fillText("Powered by OrderKaro", 60, 1850)

      resolve(canvas.toDataURL("image/png"))
    }
    img.src = qrDataUrl
  })
}

function spreadLetters(text: string) {
  return text.split("").join(" ")
}
