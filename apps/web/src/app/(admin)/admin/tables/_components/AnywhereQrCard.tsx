"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, Check, Download, ExternalLink, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { toast } from "sonner"
import { useAnywhereQr } from "../_hooks/useAnywhereQr"

interface AnywhereQrCardProps {
  slug: string | null
  canteenName: string
}

type Tab = "code" | "poster" | "link"

export function AnywhereQrCard({ slug, canteenName }: AnywhereQrCardProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>("code")
  const [copied, setCopied] = useState(false)
  const [posterUrl, setPosterUrl] = useState<string | null>(null)
  const { data } = useAnywhereQr(slug)

  useEffect(() => {
    if (!open) {
      setTab("code")
      setCopied(false)
      setPosterUrl(null)
    }
  }, [open])

  useEffect(() => {
    if (!data || !open) return
    if (tab !== "poster") return
    drawPoster(data.qrDataUrl, canteenName).then(setPosterUrl)
  }, [data, open, canteenName, tab])

  function copyUrl() {
    if (!data?.url) return
    navigator.clipboard.writeText(data.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  function downloadCode() {
    if (!data?.qrDataUrl) return
    const link = document.createElement("a")
    link.href = data.qrDataUrl
    link.download = `qr-order-from-anywhere-${slugify(canteenName)}.png`
    link.click()
  }

  function downloadPoster() {
    if (!posterUrl) return
    const link = document.createElement("a")
    link.href = posterUrl
    link.download = `poster-order-from-anywhere-${slugify(canteenName)}.png`
    link.click()
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex w-14 h-14 rounded-xl bg-neutral-50 border border-neutral-100 items-center justify-center overflow-hidden">
              {data?.qrDataUrl ? (
                <img src={data.qrDataUrl} alt="Order from Anywhere QR" className="w-full h-full" />
              ) : (
                <div className="w-full h-full bg-neutral-100 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-brand-red" />
                <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-neutral-400">
                  One QR · No table
                </p>
              </div>
              <h2 className="text-lg font-bold text-brand-black">Order from Anywhere</h2>
              <p className="text-sm text-neutral-500 max-w-md">
                Print one QR for takeaway, delivery or walk-ins. Customers pick how they want
                their order at checkout.
              </p>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -1 }}
            onClick={() => setOpen(true)}
            disabled={!slug}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold rounded-xl bg-brand-red text-white hover:bg-brand-red/90 transition-colors disabled:opacity-40 disabled:pointer-events-none shrink-0"
          >
            <Sparkles className="w-4 h-4" /> View QR
          </motion.button>
        </div>
      </motion.div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Order from Anywhere · QR">
        {data && (
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
                    <a href={data.url} target="_blank" rel="noopener noreferrer" className="flex-1">
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
    </>
  )
}

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

function drawPoster(qrDataUrl: string, canteenName: string): Promise<string> {
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
    ctx.fillText("Takeaway · Dine-in · Delivery", 540, 460)

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
      ctx.fillText("Order from Anywhere", 540, 1430)

      ctx.fillStyle = "#A3A3A3"
      ctx.font = "700 28px DM Sans, system-ui, sans-serif"
      ctx.fillText(spreadLetters("CHOOSE AT CHECKOUT"), 540, 1540)

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
