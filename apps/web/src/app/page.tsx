"use client"

import Image from "next/image"
import { Logo } from "@/components/ui/logo"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      <motion.div
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
        <Image
          src="https://res.cloudinary.com/dpjw3fe8d/image/upload/v1773754306/orderkaro/branding/orderkaro-hero-1.png"
          alt="Vision Menu"
          fill
          priority
          className="object-cover opacity-60"
        />
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-6 py-6 sm:px-10 sm:py-8"
      >
        <Logo size="sm" variant="dark" />
        <div className="rounded-full border border-white/20 bg-white/10 p-1 backdrop-blur-sm">
          <ThemeToggle />
        </div>
      </motion.header>

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6"
        >
          <Logo size="lg" variant="dark" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="font-heading text-5xl md:text-7xl lg:text-8xl font-extrabold text-white tracking-tight leading-[0.9] max-w-4xl"
        >
          Your Restaurant, Reimagined
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 text-lg md:text-xl text-neutral-300 max-w-xl font-medium"
        >
          Scan. Order. Eat. No apps, no queues, no hassle.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex items-center gap-4"
        >
          <Link href="/register">
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 bg-primary text-white text-base font-bold rounded-xl shadow-lg shadow-primary/30 flex items-center gap-2"
            >
              Get Started
              <ArrowRight size={18} />
            </motion.button>
          </Link>
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-base font-bold rounded-xl"
            >
              Login
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
