"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, ShieldCheck, KeyRound, Loader2, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import { toast } from "sonner"

interface PaymentAccount {
  connected: boolean
  status: string
  cashfreeKeyPreview: string | null
}

export function CashfreeConnectCard({ restaurantId }: { restaurantId: string }) {
  const queryClient = useQueryClient()
  const [appId, setAppId] = useState("")
  const [secretKey, setSecretKey] = useState("")

  const { data } = useQuery<PaymentAccount>({
    queryKey: ["payment-account", restaurantId],
    queryFn: () =>
      api.get(`/api/v1/restaurants/${restaurantId}/payment-account`).then((r) => r.data.data),
    enabled: !!restaurantId,
  })

  const connected = Boolean(data?.connected)

  const connect = useMutation({
    mutationFn: () =>
      api.post(`/api/v1/restaurants/${restaurantId}/payment-account`, {
        appId: appId.trim(),
        secretKey: secretKey.trim(),
      }),
    onSuccess: () => {
      toast.success(connected ? "Cashfree account updated" : "Cashfree account connected")
      queryClient.invalidateQueries({ queryKey: ["payment-account", restaurantId] })
      setAppId("")
      setSecretKey("")
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.error || "Could not save your Cashfree keys"),
  })

  const canSubmit = appId.trim().length >= 6 && secretKey.trim().startsWith("cfsk_")

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red/10">
                <ShieldCheck className="h-5 w-5 text-brand-red" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-ink">Connect your Cashfree account</h2>
                <p className="text-sm text-muted">Diners pay your account directly — you keep 100%</p>
              </div>
            </div>
            <AnimatePresence mode="wait">
              {connected ? (
                <motion.span
                  key="on"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success ring-1 ring-success/20"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                </motion.span>
              ) : (
                <motion.span
                  key="off"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1 text-xs font-bold text-warning ring-1 ring-warning/20"
                >
                  Not connected
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </CardHeader>

        <CardContent>
          <AnimatePresence>
            {connected && data?.cashfreeKeyPreview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 flex items-center gap-3 rounded-xl bg-surface px-4 py-3 ring-1 ring-line"
              >
                <KeyRound className="h-4 w-4 shrink-0 text-brand-gold" />
                <p className="text-sm text-muted">
                  Active App ID <span className="font-mono font-semibold text-ink">{data.cashfreeKeyPreview}</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-ink">App ID</label>
              <input
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="Your Cashfree App ID"
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-muted transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-ink">Secret key</label>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="cfsk_••••••••••••"
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-muted font-mono transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
              />
              <p className="text-xs text-muted">
                Encrypted and write-only — {connected ? "re-enter both to rotate your keys" : "we never show it back"}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <a
                href="https://merchant.cashfree.com/merchants/pg/developers/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-brand-red"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Where do I find these?
              </a>
              <Button onClick={() => connect.mutate()} disabled={!canSubmit || connect.isPending}>
                {connect.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {connected ? "Update keys" : "Connect Cashfree"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
