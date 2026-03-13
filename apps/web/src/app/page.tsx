"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, QrCode, ChefHat, BarChart3 } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
        <h1 className="text-xl font-extrabold text-brand-black">
          Order<span className="text-brand-red">Karo</span>
        </h1>
        <div className="flex gap-3">
          <a href="/login">
            <Button variant="outline" size="sm">Sign In</Button>
          </a>
          <a href="/register">
            <Button size="sm">Get Started</Button>
          </a>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-5xl font-extrabold text-brand-black leading-tight">
            Smart Canteen
            <br />
            <span className="text-brand-red">Management</span>
          </h2>
          <p className="text-lg text-neutral-500 mt-4 max-w-xl mx-auto">
            QR-based ordering system for college canteens. Students scan, order, and pick up. Zero queues.
          </p>
          <div className="flex gap-3 justify-center mt-8">
            <a href="/register">
              <Button size="lg">
                Start Free <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
          {[
            {
              icon: QrCode,
              title: "QR Ordering",
              desc: "Students scan a table QR code and order directly from their phone",
            },
            {
              icon: ChefHat,
              title: "Kitchen Display",
              desc: "Real-time order management with kanban board for kitchen staff",
            },
            {
              icon: BarChart3,
              title: "Analytics",
              desc: "Track revenue, popular items, and peak hours",
            },
          ].map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="p-6 rounded-2xl border border-neutral-100 hover:shadow-md transition-shadow"
            >
              <feature.icon className="w-8 h-8 text-brand-red mb-4" />
              <h3 className="font-bold text-brand-black text-lg">{feature.title}</h3>
              <p className="text-sm text-neutral-500 mt-2">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  )
}
