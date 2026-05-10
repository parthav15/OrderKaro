"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/stores/auth"
import api from "@/lib/api"
import { toast } from "sonner"

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
      router.push("/admin")
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-black flex items-center justify-center">
      <Image
        src="https://res.cloudinary.com/dpjw3fe8d/image/upload/v1773754306/orderkaro/branding/orderkaro-hero-1.png"
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
            <p className="text-neutral-500 mt-2 text-base font-medium">Create your canteen account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name"
              placeholder="Your full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoFocus
            />
            <Input
              label="Phone Number"
              type="tel"
              placeholder="10-digit mobile number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
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
              placeholder="Min 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-neutral-500 mt-7">
            Already have an account?{" "}
            <Link href="/login" className="text-[#DC2626] font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
