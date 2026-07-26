"use client"

import { useEffect, useRef, useState, type FC, type Ref, type DetailedHTMLProps, type HTMLAttributes } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2, Scan, Smartphone } from "lucide-react"

type ModelViewerAttributes = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  ref?: Ref<HTMLElement>
  src?: string
  poster?: string
  alt?: string
  ar?: boolean
  "ar-modes"?: string
  "ar-scale"?: string
  "ar-placement"?: string
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

function isBlockedInAppBrowser() {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent
  if (!/iPhone|iPad|iPod/.test(ua)) return false
  return /Instagram|FBAN|FBAV|FB_IAB|Messenger|MicroMessenger|Line\/|Snapchat|Pinterest/i.test(ua)
}

type ArState = "checking" | "ready" | "unsupported" | "blocked"

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
  const [arState, setArState] = useState<ArState>("checking")
  const modelRef = useRef<HTMLElement | null>(null)

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

  useEffect(() => {
    if (!ready) return
    if (isBlockedInAppBrowser()) {
      setArState("blocked")
      return
    }
    const el = modelRef.current
    if (!el) return
    let settled = false
    const evaluate = (final: boolean) => {
      if (settled) return
      const supported = Boolean((el as unknown as { canActivateAR?: boolean }).canActivateAR)
      if (supported) {
        settled = true
        setArState("ready")
      } else if (final) {
        settled = true
        setArState("unsupported")
      }
    }
    const onLoad = () => evaluate(false)
    el.addEventListener("load", onLoad)
    evaluate(false)
    const t1 = window.setTimeout(() => evaluate(false), 500)
    const t2 = window.setTimeout(() => evaluate(true), 1600)
    return () => {
      el.removeEventListener("load", onLoad)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [ready])

  const showFallback = arState === "unsupported" || arState === "blocked"

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
            <Scan className="w-5 h-5 text-brand-gold" />
            <span className="font-bold text-sm tracking-wide uppercase">{itemName}</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Close AR view"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="relative flex-1 min-h-0 px-4 pb-6">
          {failed ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
              <p className="text-white font-bold">Could not load the AR view</p>
              <p className="text-neutral-400 text-sm">Please check your connection and try again.</p>
            </div>
          ) : !ready ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
              <p className="text-neutral-400 text-sm font-medium">Preparing AR...</p>
            </div>
          ) : (
            <>
              <ModelViewer
                ref={modelRef}
                src={modelUrl}
                poster={posterUrl ?? undefined}
                ios-src={usdzUrl ?? undefined}
                alt={itemName}
                ar
                ar-modes="webxr scene-viewer quick-look"
                ar-scale="auto"
                ar-placement="floor"
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
                    <Scan className="w-14 h-14 text-white/25" />
                    <span className="text-white/50 text-sm font-semibold tracking-wide">{itemName}</span>
                  </div>
                )}
                <button
                  slot="ar-button"
                  style={{ backgroundColor: "rgb(var(--brand-red))" }}
                  className={`absolute bottom-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-2.5 rounded-full px-7 py-4 text-white font-bold text-[15px] shadow-2xl shadow-brand-red/40 ring-1 ring-white/20 transition-transform active:scale-95 whitespace-nowrap${showFallback ? " hidden" : ""}`}
                >
                  <Scan className="w-5 h-5" />
                  View on your table
                </button>
              </ModelViewer>

              <AnimatePresence>
                {showFallback && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-x-4 bottom-6 flex items-start gap-3 rounded-2xl bg-white/10 backdrop-blur-md ring-1 ring-white/15 px-5 py-4"
                  >
                    <Smartphone className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
                    <p className="text-white/85 text-sm font-medium leading-snug">
                      {arState === "blocked"
                        ? "Tap the browser menu and choose “Open in Safari” to place this dish on your table."
                        : "AR opens on your phone. Scan the menu QR with your phone camera, then tap “View on your table.”"}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        {!failed && ready && !showFallback && (
          <p className="text-center text-neutral-500 text-xs pb-6 px-6">
            Tap &ldquo;View on your table&rdquo; to place {itemName} in your space — works on iPhone &amp; Android.
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
