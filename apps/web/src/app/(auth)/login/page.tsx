"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/stores/auth"
import api from "@/lib/api"
import { toast } from "sonner"

type LoginMode = "owner" | "staff"

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [mode, setMode] = useState<LoginMode>("owner")
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: "",
    password: "",
    canteenSlug: "",
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
          `/api/v1/public/canteen/${form.canteenSlug}/menu`
        )
        const canteenId = slugRes.data.data.canteen.id

        const { data } = await api.post("/api/v1/auth/staff/login", {
          canteenId,
          email: form.email,
          password: form.password,
        })
        const role = data.data.staff.role
        setAuth(
          {
            id: data.data.staff.id,
            name: data.data.staff.name,
            role,
            canteenId,
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
    <div className="relative min-h-dvh w-full overflow-hidden bg-black flex items-center justify-center">
      <Image
        src="https://res.cloudinary.com/dpjw3fe8d/image/upload/v1773754328/orderkaro/branding/orderkaro-hero-2.png"
        alt=""
        fill
        priority
        className="object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/30 to-black/60" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/20 p-8 md:p-10">
          <div className="text-center mb-8">
            <Link href="/">
              <Logo size="lg" />
            </Link>
            <p className="text-neutral-500 mt-2 text-base font-medium">Welcome back</p>
          </div>

          <div className="flex gap-2 mb-7 bg-neutral-100 p-1 rounded-xl">
            {(["owner", "staff"] as LoginMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`relative flex-1 py-3 rounded-lg text-sm font-bold transition-all duration-200 ${
                  mode === m
                    ? "bg-[#0A0A0A] text-white shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                {m === "owner" ? "Owner" : "Staff"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {mode === "owner" ? (
                <motion.div
                  key="owner"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Enter password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="staff"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <Input
                    label="Canteen Slug"
                    placeholder="e.g. campus-cafe"
                    value={form.canteenSlug}
                    onChange={(e) =>
                      setForm({ ...form, canteenSlug: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="staff@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Enter password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-neutral-500 mt-7">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-[#DC2626] font-bold hover:underline"
            >
              Register
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
