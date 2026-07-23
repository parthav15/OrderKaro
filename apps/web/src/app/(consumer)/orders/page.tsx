"use client"

import { motion } from "framer-motion"
import { QrCode } from "lucide-react"
import { Logo } from "@/components/ui/logo"

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-6">
      <motion.div
        initial="hidden"
        animate="show"
        variants={containerVariants}
        className="text-center"
      >
        <motion.div
          variants={itemVariants}
          className="w-20 h-20 rounded-full bg-surface-elevated flex items-center justify-center mx-auto mb-5"
        >
          <QrCode className="w-10 h-10 text-muted" />
        </motion.div>
        <motion.div variants={itemVariants} className="flex justify-center">
          <Logo size="lg" />
        </motion.div>
        <motion.p variants={itemVariants} className="text-muted mt-3 text-sm leading-relaxed">
          Scan the QR code at your table to browse the menu and place an order.
        </motion.p>
      </motion.div>
    </div>
  )
}
