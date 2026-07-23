"use client"

import { motion } from "framer-motion"
import { QrCode } from "lucide-react"
import { useQrThumb } from "../_hooks/useQrThumb"

interface TableCardQrThumbProps {
  restaurantId: string
  tableId: string
  size?: number
  hovered?: boolean
}

export function TableCardQrThumb({
  restaurantId,
  tableId,
  size = 88,
  hovered = false,
}: TableCardQrThumbProps) {
  const { data, isLoading } = useQrThumb(restaurantId, tableId)

  return (
    <motion.div
      animate={{ scale: hovered ? 1.04 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      style={{ width: size, height: size }}
      className="relative rounded-xl overflow-hidden bg-surface-elevated ring-1 ring-inset ring-line shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] flex items-center justify-center"
    >
      {data?.qrDataUrl ? (
        <motion.img
          src={data.qrDataUrl}
          alt="QR code"
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            filter: hovered ? "contrast(1.1)" : "contrast(1)",
          }}
          transition={{ duration: 0.25 }}
          className="w-full h-full object-cover p-1.5"
        />
      ) : isLoading ? (
        <div className="w-full h-full bg-gradient-to-br from-surface-elevated via-surface to-surface-elevated animate-pulse" />
      ) : (
        <QrCode className="w-7 h-7 text-muted" />
      )}
    </motion.div>
  )
}
