"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/stores/auth"
import api from "@/lib/api"
import { toast } from "sonner"

type LoginMode = "owner" | "staff"

const easePremium = [0.22, 1, 0.36, 1] as const

const fieldContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

const fieldItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: easePremium } },
}

function revealUp(delay: number) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: easePremium },
  }
}

function FormField({ children }: { children: React.ReactNode }) {
  const [focused, setFocused] = useState(false)
  return (
    <motion.div
      variants={fieldItem}
      className="relative"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -inset-1 rounded-2xl bg-primary/20 blur-md"
        animate={{ opacity: focused ? 1 : 0 }}
        transition={{ duration: 0.3, ease: easePremium }}
      />
      <div className="relative">{children}</div>
    </motion.div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [mode, setMode] = useState<LoginMode>("owner")
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: "",
    password: "",
    restaurantSlug: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === "owner") {
        const { data } = await api.post("/api/v1/auth/owner/login", {
          email: form.email,
          password: form.password,
        })
        setAuth(
          {
            id: data.data.owner.id,
            name: data.data.owner.name,
            email: data.data.owner.email,
            role: "OWNER",
          },
          data.data.accessToken,
          data.data.refreshToken
        )
        router.push("/admin")
      } else {
        const slugRes = await api.get(
          `/api/v1/public/restaurant/${form.restaurantSlug}/menu`
        )
        const restaurantId = slugRes.data.data.restaurant.id

        const { data } = await api.post("/api/v1/auth/staff/login", {
          restaurantId,
          email: form.email,
          password: form.password,
        })
        const role = data.data.staff.role
        setAuth(
          {
            id: data.data.staff.id,
            name: data.data.staff.name,
            role,
            restaurantId,
          },
          data.data.accessToken,
          data.data.refreshToken
        )
        router.push(role === "COUNTER" ? "/counter" : "/kitchen")
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <motion.div {...revealUp(0)} className="mb-8 text-center">
        <span className="mx-auto mb-4 block h-1 w-12 rounded-full bg-gradient-to-r from-primary to-accent" />
        <h1 className="font-serif text-3xl italic text-ink">Welcome back</h1>
        <p className="mt-2 text-sm text-muted">Sign in to manage your restaurant</p>
      </motion.div>

      <motion.div
        {...revealUp(0.08)}
        className="relative mb-8 flex gap-1 rounded-2xl border border-line bg-surface p-1"
      >
        {(["owner", "staff"] as LoginMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className="relative flex-1 rounded-xl py-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {mode === m && (
              <motion.span
                layoutId="login-mode-pill"
                aria-hidden
                className="absolute inset-0 rounded-xl bg-primary"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span
              className={`relative z-10 transition-colors duration-200 ${
                mode === m ? "text-white" : "text-muted"
              }`}
            >
              {m === "owner" ? "Owner" : "Staff"}
            </span>
          </button>
        ))}
      </motion.div>

      <motion.form {...revealUp(0.16)} onSubmit={handleSubmit} className="space-y-5">
        <AnimatePresence mode="wait">
          {mode === "owner" ? (
            <motion.div
              key="owner"
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, x: 14, transition: { duration: 0.25, ease: easePremium } }}
              variants={fieldContainer}
              className="space-y-5"
            >
              <FormField>
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </FormField>
              <FormField>
                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </FormField>
            </motion.div>
          ) : (
            <motion.div
              key="staff"
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, x: 14, transition: { duration: 0.25, ease: easePremium } }}
              variants={fieldContainer}
              className="space-y-5"
            >
              <FormField>
                <Input
                  label="Restaurant Slug"
                  placeholder="e.g. campus-cafe"
                  value={form.restaurantSlug}
                  onChange={(e) =>
                    setForm({ ...form, restaurantSlug: e.target.value })
                  }
                  required
                />
              </FormField>
              <FormField>
                <Input
                  label="Email"
                  type="email"
                  placeholder="staff@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </FormField>
              <FormField>
                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </FormField>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative pt-2">
          <span aria-hidden className="absolute inset-x-6 -bottom-2 h-8 rounded-full bg-primary/25 blur-xl" />
          <Button type="submit" className="relative w-full" size="lg" loading={loading}>
            Sign In
          </Button>
        </div>
      </motion.form>

      <motion.p {...revealUp(0.24)} className="mt-8 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="group relative font-semibold text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Register
          <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
        </Link>
      </motion.p>
    </div>
  )
}
