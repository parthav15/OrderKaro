"use client"

import { motion } from "framer-motion"
import { QrCode } from "lucide-react"

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-5">
          <QrCode className="w-10 h-10 text-neutral-300" />
        </div>
        <h1 className="text-3xl font-extrabold text-brand-black">
          Order<span className="text-brand-red">Karo</span>
        </h1>
        <p className="text-neutral-500 mt-3 text-sm leading-relaxed">
          Scan the QR code at your table to browse the menu and place an order.
        </p>
      </motion.div>
    </div>
  )
}
