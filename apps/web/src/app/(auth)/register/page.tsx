"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/stores/auth"
import api from "@/lib/api"
import { toast } from "sonner"

const easePremium = [0.22, 1, 0.36, 1] as const

const formContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
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

export default function RegisterPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { data } = await api.post("/api/v1/auth/owner/register", {
        email: form.email,
        password: form.password,
        name: form.name,
        phone: form.phone,
      })
      setAuth(
        { id: data.data.owner.id, name: data.data.owner.name, email: data.data.owner.email, role: "OWNER" },
        data.data.accessToken,
        data.data.refreshToken
      )
      toast.success("Account created successfully")
      router.push("/owner")
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <motion.div {...revealUp(0)} className="mb-8 text-center">
        <span className="mx-auto mb-4 block h-1 w-12 rounded-full bg-gradient-to-r from-primary to-accent" />
        <h1 className="font-serif text-3xl italic text-ink">Create your account</h1>
        <p className="mt-2 text-sm text-muted">Set up your restaurant on Vision Menu</p>
      </motion.div>

      <motion.form
        initial="hidden"
        animate="show"
        variants={formContainer}
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <FormField>
          <Input
            label="Full Name"
            placeholder="Your full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            autoFocus
          />
        </FormField>
        <FormField>
          <Input
            label="Phone Number"
            type="tel"
            placeholder="10-digit mobile number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
        </FormField>
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
            placeholder="Min 8 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </FormField>

        <motion.div variants={fieldItem} className="relative pt-2">
          <span aria-hidden className="absolute inset-x-6 -bottom-2 h-8 rounded-full bg-primary/25 blur-xl" />
          <Button type="submit" className="relative w-full" size="lg" loading={loading}>
            Create Account
          </Button>
        </motion.div>
      </motion.form>

      <motion.p {...revealUp(0.65)} className="mt-8 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="group relative font-semibold text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Sign In
          <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
        </Link>
      </motion.p>
    </div>
  )
}
