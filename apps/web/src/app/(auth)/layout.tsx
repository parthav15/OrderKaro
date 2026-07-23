"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Logo } from "@/components/ui/logo"
import { ThemeToggle } from "@/components/ui/theme-toggle"

const easePremium = [0.22, 1, 0.36, 1] as const

const flecks = [
  { top: "14%", left: "20%", size: 6, delay: 0, duration: 7.5 },
  { top: "26%", left: "76%", size: 4, delay: 1.1, duration: 9 },
  { top: "58%", left: "14%", size: 5, delay: 0.5, duration: 8.2 },
  { top: "70%", left: "82%", size: 3, delay: 1.8, duration: 10 },
  { top: "44%", left: "50%", size: 3, delay: 1.4, duration: 6.8 },
  { top: "86%", left: "42%", size: 4, delay: 0.3, duration: 8.6 },
  { top: "8%", left: "58%", size: 3, delay: 2.2, duration: 7.2 },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className="relative min-h-dvh w-full bg-canvas lg:grid lg:grid-cols-2">
      <div className="fixed right-4 top-4 z-50 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary-pressed to-primary-pressed lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-14 xl:px-20">
        <div aria-hidden className="absolute inset-0 bg-black/30" />
        <div aria-hidden className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-primary-pressed/70 blur-3xl" />

        {flecks.map((fleck) => (
          <motion.span
            key={`${fleck.top}-${fleck.left}`}
            aria-hidden
            className="absolute rounded-full bg-accent"
            style={{ top: fleck.top, left: fleck.left, width: fleck.size, height: fleck.size }}
            animate={
              prefersReducedMotion
                ? { opacity: 0.5 }
                : { y: [0, -18, 0], opacity: [0.25, 0.85, 0.25] }
            }
            transition={{
              duration: fleck.duration,
              delay: fleck.delay,
              repeat: prefersReducedMotion ? 0 : Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easePremium }}
          className="relative z-10"
        >
          <Link href="/">
            <Logo size="lg" variant="dark" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: easePremium }}
          className="relative z-10 max-w-md space-y-5"
        >
          <h1 className="font-serif text-4xl italic leading-tight text-white xl:text-5xl">
            Run your restaurant,
            <br />
            beautifully.
          </h1>
          <p className="text-base text-white/70">
            One calm dashboard for menus, kitchens, and staff — built for restaurants
            that care about the details.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.35, ease: easePremium }}
          className="relative z-10 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-white/50"
        >
          <span className="h-px w-8 bg-white/30" />
          Owner &amp; staff access
        </motion.div>
      </aside>

      <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 pb-16 pt-20 sm:px-10 sm:pt-24 lg:bg-surface lg:px-16 lg:py-0">
        <div className="mb-10 flex justify-center lg:hidden">
          <Link href="/" aria-label="Vision Menu">
            <Logo size="lg" />
          </Link>
        </div>

        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.35, ease: easePremium }}
              className="rounded-3xl border border-line bg-surface-elevated p-8 shadow-xl sm:p-10 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
