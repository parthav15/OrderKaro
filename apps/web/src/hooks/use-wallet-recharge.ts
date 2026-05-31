"use client"

import { useState, useCallback } from "react"
import api from "@/lib/api"
import { toast } from "sonner"

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js"

interface RechargePrefill {
  name?: string
  contact?: string
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false)
    if ((window as { Razorpay?: unknown }).Razorpay) return resolve(true)
    const script = document.createElement("script")
    script.src = RAZORPAY_SCRIPT
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function useWalletRecharge() {
  const [recharging, setRecharging] = useState(false)

  const recharge = useCallback(
    async (amount: number, prefill?: RechargePrefill): Promise<number | null> => {
      setRecharging(true)

      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        toast.error("Could not load the payment gateway")
        setRecharging(false)
        return null
      }

      let order: { orderId: string; amount: number; currency: string; keyId: string }
      try {
        const { data } = await api.post("/api/v1/consumer/wallet/recharge/razorpay/order", {
          amount,
        })
        order = data.data
      } catch (err) {
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          "Could not start payment"
        toast.error(message)
        setRecharging(false)
        return null
      }

      return new Promise<number | null>((resolve) => {
        const RazorpayConstructor = (
          window as unknown as {
            Razorpay: new (opts: unknown) => {
              open: () => void
              on: (event: string, cb: () => void) => void
            }
          }
        ).Razorpay

        const checkout = new RazorpayConstructor({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          order_id: order.orderId,
          name: "OrderKaro",
          description: "Wallet top-up",
          prefill,
          theme: { color: "#DC2626" },
          handler: async (response: {
            razorpay_order_id: string
            razorpay_payment_id: string
            razorpay_signature: string
          }) => {
            try {
              const { data } = await api.post(
                "/api/v1/consumer/wallet/recharge/razorpay/verify",
                {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }
              )
              toast.success("Wallet topped up")
              setRecharging(false)
              resolve(Number(data.data.balance))
            } catch {
              toast.error("Payment verification failed. Any deduction will be reconciled.")
              setRecharging(false)
              resolve(null)
            }
          },
          modal: {
            ondismiss: () => {
              setRecharging(false)
              resolve(null)
            },
          },
        })

        checkout.on("payment.failed", () => {
          toast.error("Payment failed")
          setRecharging(false)
          resolve(null)
        })
        checkout.open()
      })
    },
    []
  )

  return { recharging, recharge }
}
