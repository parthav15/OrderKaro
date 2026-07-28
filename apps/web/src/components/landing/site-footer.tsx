"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Logo } from "@/components/ui/logo"

const EASE = [0.22, 1, 0.36, 1] as const

const PRODUCT_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
]

const ACCOUNT_LINKS = [
  { href: "/login", label: "Sign in" },
  { href: "/register", label: "Get started" },
]

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/refunds", label: "Refunds & Cancellations" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/contact", label: "Contact Us" },
]

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative border-t border-line px-6 py-16">
      <motion.div
        initial={{ y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="mx-auto max-w-7xl"
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12">
          <div className="max-w-sm">
            <Logo size="md" />
            <p className="mt-4 text-sm text-muted leading-relaxed">
              The premium ordering platform for restaurants — QR menus, AR previews, live kitchen
              displays and instant checkout, all in one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-16">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Product</p>
              <ul className="mt-4 flex flex-col gap-3">
                {PRODUCT_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm font-medium text-ink/75 hover:text-ink transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Account</p>
              <ul className="mt-4 flex flex-col gap-3">
                {ACCOUNT_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-ink/75 hover:text-ink transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Legal</p>
              <ul className="mt-4 flex flex-col gap-3">
                {LEGAL_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-ink/75 hover:text-ink transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted font-medium">© {year} Vision Menu. All rights reserved.</p>
          <p className="text-xs text-muted font-medium">Built for restaurants that want to feel effortless.</p>
        </div>
      </motion.div>
    </footer>
  )
}
