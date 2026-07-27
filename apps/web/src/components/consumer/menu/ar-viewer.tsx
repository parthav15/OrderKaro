"use client"

import { useEffect, useRef, useState, type FC, type Ref, type DetailedHTMLProps, type HTMLAttributes } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2, Scan, Smartphone, Hand } from "lucide-react"

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
  "auto-rotate-delay"?: string
  "rotation-per-second"?: string
  "shadow-intensity"?: string
  "shadow-softness"?: string
  "environment-image"?: string
  exposure?: string
  "interaction-prompt"?: string
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
  const [revealed, setRevealed] = useState(false)
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
    const onLoad = () => {
      setRevealed(true)
      evaluate(false)
    }
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
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[60] flex flex-col"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 15%, #241016 0%, #150a0d 45%, #0c0708 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(217,178,74,0.9) 1px, transparent 0)",
            backgroundSize: "26px 26px",
          }}
        />

        <div className="relative flex items-center justify-between px-5 py-4 shrink-0">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex items-center gap-2.5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gold/15 ring-1 ring-brand-gold/30">
              <Scan className="h-[18px] w-[18px] text-brand-gold" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-gold/70">
                AR Preview
              </span>
              <span className="text-sm font-bold text-white">{itemName}</span>
            </div>
          </motion.div>
          <motion.button
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.05 }}
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-md transition-colors hover:bg-white/20"
            aria-label="Close AR view"
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>

        <div className="relative flex-1 min-h-0 px-4 pb-6">
          {failed ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="font-bold text-white">Could not load the 3D view</p>
              <p className="text-sm text-neutral-400">Please check your connection and try again.</p>
            </div>
          ) : !ready ? (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-brand-gold" />
              <p className="text-sm font-medium text-neutral-400">Preparing 3D…</p>
            </div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="relative h-full w-full"
              >
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
                  camera-controls
                  auto-rotate
                  auto-rotate-delay="0"
                  rotation-per-second="26deg"
                  shadow-intensity="1.15"
                  shadow-softness="1"
                  environment-image="neutral"
                  exposure="1.05"
                  interaction-prompt="none"
                  reveal="auto"
                  loading="eager"
                  touch-action="pan-y"
                  style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
                >
                  <div
                    slot="poster"
                    className="flex h-full w-full flex-col items-center justify-center gap-4"
                  >
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={itemName}
                        className="max-h-[60%] w-auto rounded-3xl object-contain opacity-80 shadow-2xl"
                      />
                    ) : (
                      <Scan className="h-14 w-14 text-white/20" />
                    )}
                    <div className="flex items-center gap-2 text-white/50">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs font-semibold tracking-wide">Loading 3D model…</span>
                    </div>
                  </div>

                  <button
                    slot="ar-button"
                    className={`absolute bottom-6 left-1/2 -translate-x-1/2 ${showFallback ? "hidden" : ""}`}
                  >
                    <span className="relative inline-flex items-center gap-2.5 whitespace-nowrap rounded-full bg-brand-red px-8 py-4 text-[15px] font-bold text-white shadow-2xl shadow-brand-red/50 ring-1 ring-white/20">
                      <motion.span
                        aria-hidden
                        className="absolute inset-0 rounded-full ring-2 ring-brand-gold/60"
                        animate={{ opacity: [0.55, 0, 0.55], scale: [1, 1.28, 1] }}
                        transition={{ duration: 2.1, repeat: Infinity, ease: "easeOut" }}
                      />
                      <Scan className="h-5 w-5" />
                      View on your table
                    </span>
                  </button>
                </ModelViewer>
              </motion.div>

              <AnimatePresence>
                {revealed && !showFallback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="pointer-events-none absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[11px] font-semibold text-white/80 ring-1 ring-white/10 backdrop-blur-md"
                  >
                    <motion.span
                      animate={{ rotate: [0, -14, 14, 0] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Hand className="h-3.5 w-3.5 text-brand-gold" />
                    </motion.span>
                    Drag to spin
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showFallback && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-x-4 bottom-6 flex items-start gap-3 rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/15 backdrop-blur-md"
                  >
                    <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-brand-gold" />
                    <p className="text-sm font-medium leading-snug text-white/85">
                      {arState === "blocked"
                        ? "Tap the browser menu and choose “Open in Safari” to place this dish on your table."
                        : "Spin it here, or scan the menu QR with your phone camera to place it on your table."}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        {!failed && ready && !showFallback && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="relative px-6 pb-6 text-center text-xs text-neutral-500"
          >
            Tap “View on your table” to place {itemName} in your space — works on iPhone &amp; Android.
          </motion.p>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
