"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
      toast.success("Settings updated")
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed"),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-brand-black">Settings</h1>
        {canteens && canteens.length > 1 && (
          <select
            value={canteenId}
            onChange={(e) => setCanteenId(e.target.value)}
            className="px-4 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-brand-red"
          >
            {canteens.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <h2 className="font-bold">Canteen Settings</h2>
        </CardHeader>
        <CardContent>
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
            className="space-y-4"
          >
            <Input
              label="Canteen Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Opening Time"
                type="time"
                value={form.openingTime}
                onChange={(e) => setForm({ ...form, openingTime: e.target.value })}
              />
              <Input
                label="Closing Time"
                type="time"
                value={form.closingTime}
                onChange={(e) => setForm({ ...form, closingTime: e.target.value })}
              />
            </div>
            <Input
              label="Avg Prep Time (minutes)"
              type="number"
              value={String(form.avgPrepTime)}
              onChange={(e) => setForm({ ...form, avgPrepTime: Number(e.target.value) })}
            />
            <Button type="submit" loading={update.isPending}>
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
