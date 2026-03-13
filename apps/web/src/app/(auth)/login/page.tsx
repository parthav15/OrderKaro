"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-brand-black">
            Order<span className="text-brand-red">Karo</span>
          </h1>
          <p className="text-neutral-500 mt-2">Sign in to continue</p>
        </div>

        <div className="flex gap-2 mb-6">
          {(["owner", "staff"] as LoginMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                mode === m
                  ? "bg-brand-black text-white"
                  : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {m === "owner" ? "Owner" : "Staff"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "owner" && (
            <>
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
            </>
          )}

          {mode === "staff" && (
            <>
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
            </>
          )}

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Sign In
          </Button>
        </form>

        <p className="text-center text-sm text-neutral-500 mt-6">
          Don&apos;t have an account?{" "}
          <a
            href="/register"
            className="text-brand-red font-semibold hover:underline"
          >
            Register
          </a>
        </p>
      </motion.div>
    </div>
  )
}
