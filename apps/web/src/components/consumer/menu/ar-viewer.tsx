"use client"

import { useEffect, useState, type FC, type DetailedHTMLProps, type HTMLAttributes } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Box, Loader2, Scan } from "lucide-react"

type ModelViewerAttributes = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  src?: string
  poster?: string
  alt?: string
  ar?: boolean
  "ar-modes"?: string
  "camera-controls"?: boolean
  "auto-rotate"?: boolean
  "shadow-intensity"?: string
  "touch-action"?: string
  "ios-src"?: string
  reveal?: string
  loading?: string
}

const ModelViewer = "model-viewer" as unknown as FC<ModelViewerAttributes>

let modelViewerLoader: Promise<unknown> | null = null

function loadModelViewer() {
  if (!modelViewerLoader) {
    modelViewerLoader = import("@google/model-viewer")
  }
  return modelViewerLoader
}

export function ArViewer({
  modelUrl,
  posterUrl,
  usdzUrl,
  itemName,
  onClose,
}: {
  modelUrl: string
  posterUrl?: string | null
  usdzUrl?: string | null
  itemName: string
  onClose: () => void
}) {
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    loadModelViewer()
      .then(() => {
        if (active) setReady(true)
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-brand-black/95 flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 shrink-0">
          <div className="flex items-center gap-2 text-white">
            <Box className="w-5 h-5" />
            <span className="font-bold text-sm tracking-wide uppercase">{itemName}</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Close 3D view"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="flex-1 min-h-0 px-4 pb-6">
          {failed ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
              <p className="text-white font-bold">Could not load the 3D view</p>
              <p className="text-neutral-400 text-sm">Please check your connection and try again.</p>
            </div>
          ) : !ready ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
              <p className="text-neutral-400 text-sm font-medium">Preparing 3D view...</p>
            </div>
          ) : (
            <ModelViewer
              src={modelUrl}
              poster={posterUrl ?? undefined}
              ios-src={usdzUrl ?? undefined}
              alt={itemName}
              ar
              ar-modes="webxr scene-viewer quick-look"
              reveal="manual"
              loading="eager"
              touch-action="none"
              style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
            >
              {!posterUrl && (
                <div
                  slot="poster"
                  className="w-full h-full flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-brand-black to-neutral-900"
                >
                  <Box className="w-14 h-14 text-white/25" />
                  <span className="text-white/50 text-sm font-semibold tracking-wide">{itemName}</span>
                </div>
              )}
              <button
                slot="ar-button"
                style={{ backgroundColor: "rgb(var(--brand-red))" }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-2.5 rounded-full px-7 py-4 text-white font-bold text-[15px] shadow-2xl shadow-brand-red/40 ring-1 ring-white/20 transition-transform active:scale-95"
              >
                <Scan className="w-5 h-5" />
                View on your table
              </button>
            </ModelViewer>
          )}
        </div>

        <p className="text-center text-neutral-500 text-xs pb-6 px-6">
          Tap &ldquo;View on your table&rdquo; to place {itemName} in your space — AR works on iPhone &amp; Android.
        </p>
      </motion.div>
    </AnimatePresence>
  )
}
