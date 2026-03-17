"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Settings, Clock, Store, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import api from "@/lib/api"
import { toast } from "sonner"

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [canteenId, setCanteenId] = useState<string>("")
  const [form, setForm] = useState({
    name: "",
    openingTime: "08:00",
    closingTime: "22:00",
    avgPrepTime: 15,
  })

  const { data: canteens } = useQuery({
    queryKey: ["canteens"],
    queryFn: () => api.get("/api/v1/canteens").then((r) => r.data.data),
  })

  useEffect(() => {
    if (canteens?.[0] && !canteenId) {
      setCanteenId(canteens[0].id)
    }
  }, [canteens, canteenId])

  const canteen = canteens?.find((c: any) => c.id === canteenId)

  useEffect(() => {
    if (canteen) {
      setForm({
        name: canteen.name || "",
        openingTime: canteen.openingTime || "08:00",
        closingTime: canteen.closingTime || "22:00",
        avgPrepTime: canteen.avgPrepTime || 15,
      })
    }
  }, [canteen])

  const update = useMutation({
    mutationFn: (data: any) => api.put(`/api/v1/canteens/${canteenId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canteens"] })
      toast.success("Settings saved successfully")
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to save"),
  })

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-brand-red" />
            </div>
            <h1 className="text-3xl font-extrabold text-brand-black">Settings</h1>
          </div>
          <p className="text-neutral-500">Update your canteen's basic information and hours</p>
        </div>
        {canteens && canteens.length > 1 && (
          <select
            value={canteenId}
            onChange={(e) => setCanteenId(e.target.value)}
            className="px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-brand-red"
          >
            {canteens.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          update.mutate({
            name: form.name,
            openingTime: form.openingTime,
            closingTime: form.closingTime,
            avgPrepTime: Number(form.avgPrepTime),
          })
        }}
        className="max-w-2xl space-y-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center">
                  <Store className="w-5 h-5 text-neutral-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-brand-black">Canteen Name</h2>
                  <p className="text-sm text-neutral-400">The name shown to customers on the menu page</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Main Campus Cafeteria"
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-brand-black placeholder:text-neutral-400 transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-neutral-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-brand-black">Operating Hours</h2>
                  <p className="text-sm text-neutral-400">When your canteen accepts orders</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-brand-black">Opens At</label>
                  <input
                    type="time"
                    value={form.openingTime}
                    onChange={(e) => setForm({ ...form, openingTime: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-brand-black transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-brand-black">Closes At</label>
                  <input
                    type="time"
                    value={form.closingTime}
                    onChange={(e) => setForm({ ...form, closingTime: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-brand-black transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                  />
                </div>
              </div>

              {form.openingTime && form.closingTime && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 p-3 bg-neutral-50 rounded-xl"
                >
                  <Clock className="w-4 h-4 text-neutral-400" />
                  <p className="text-sm text-neutral-600">
                    Open from <strong>{form.openingTime}</strong> to <strong>{form.closingTime}</strong>
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-neutral-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-brand-black">Average Preparation Time</h2>
                  <p className="text-sm text-neutral-400">Shown to customers as expected wait time</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={String(form.avgPrepTime)}
                  onChange={(e) => setForm({ ...form, avgPrepTime: Number(e.target.value) })}
                  className="w-32 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-brand-black transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                />
                <span className="text-base font-semibold text-neutral-600">minutes</span>
              </div>
              <p className="text-sm text-neutral-400">
                Customers see: "Ready in approximately {form.avgPrepTime} minutes"
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button type="submit" size="lg" className="w-full" loading={update.isPending}>
            <CheckCircle2 className="w-5 h-5" /> Save All Settings
          </Button>
        </motion.div>
      </form>
    </div>
  )
}
