"use client"

import { useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, X, Loader2 } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"

interface ImageUploadProps {
  value: string
  onUpload: (url: string) => void
}

export function ImageUpload({ value, onUpload }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    setIsUploading(true)
    try {
      const { data } = await api.post("/api/v1/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      onUpload(data.data.url)
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Upload failed")
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation()
    onUpload("")
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">Item Image (optional)</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <AnimatePresence mode="wait">
        {value ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative w-full h-36 rounded-xl overflow-hidden border border-line group cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            <img
              src={value}
              alt="Item preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 bg-surface rounded-full shadow-md hover:bg-surface-elevated transition-colors"
            >
              <X className="w-3.5 h-3.5 text-ink" />
            </motion.button>
          </motion.div>
        ) : (
          <motion.button
            key="placeholder"
            type="button"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            whileHover={{ borderColor: "rgb(var(--brand-red))" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => !isUploading && inputRef.current?.click()}
            disabled={isUploading}
            className="w-full h-36 rounded-xl border-2 border-dashed border-line flex flex-col items-center justify-center gap-2 transition-colors disabled:pointer-events-none"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-brand-red animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-muted" />
            )}
            <span className="text-sm text-muted font-medium">
              {isUploading ? "Uploading..." : "Click to upload image"}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
