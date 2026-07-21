import { useState } from "react"
import { View, Modal, Pressable, Linking, ActivityIndicator } from "react-native"
import { MotiView, AnimatePresence } from "moti"
import QRCode from "react-native-qrcode-svg"
import { WebView } from "react-native-webview"
import * as Haptics from "expo-haptics"
import { Check, X, ExternalLink } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/theme/theme-provider"
import { usePaymentPolling } from "@/lib/use-payment-polling"
import type { PaymentSession } from "@/lib/types"

const SYMBOLS: Record<string, string> = { INR: "₹", USD: "$", GBP: "£", EUR: "€" }

function money(amount: number, currency: string) {
  return `${SYMBOLS[currency] ?? currency + " "}${amount}`
}

export function PaymentSheet({
  session,
  title,
  onSuccess,
  onClose,
}: {
  session: PaymentSession | null
  title: string
  onSuccess: (data: Record<string, unknown>) => void
  onClose: () => void
}) {
  const { colors } = useTheme()
  const [stage, setStage] = useState<"paying" | "success" | "failed">("paying")
  const [stripeOpen, setStripeOpen] = useState(false)
  const open = !!session

  usePaymentPolling({
    pollUrl: session?.pollUrl ?? "",
    pollBody: session?.pollBody ?? {},
    enabled: open && stage === "paying",
    onResolved: (status, data) => {
      if (status === "PAID") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        setStage("success")
        setTimeout(() => onSuccess(data), 1100)
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        setStage("failed")
      }
    },
  })

  function close() {
    setStage("paying")
    setStripeOpen(false)
    onClose()
  }

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={close}>
      <View className="flex-1 bg-black/70 justify-end">
        <Pressable className="flex-1" onPress={close} />
        <AnimatePresence>
          {open && (
            <MotiView
              from={{ translateY: 400 }}
              animate={{ translateY: 0 }}
              exit={{ translateY: 400 }}
              transition={{ type: "spring", damping: 24, stiffness: 220 }}
              className="bg-surface-elevated rounded-t-[32px] px-6 pt-5 pb-10"
            >
              <View className="items-center mb-4">
                <View className="w-10 h-1.5 rounded-full bg-line" />
              </View>

              <View className="flex-row items-start justify-between mb-6">
                <View>
                  <Text variant="muted" className="text-xs tracking-widest uppercase mb-1">
                    {title}
                  </Text>
                  {session && (
                    <Text variant="heading" className="text-4xl">
                      {money(session.amount, session.currency)}
                    </Text>
                  )}
                </View>
                <Pressable
                  onPress={close}
                  className="w-10 h-10 rounded-full bg-surface items-center justify-center"
                >
                  <X size={18} color={colors.muted} />
                </Pressable>
              </View>

              {stage === "success" ? (
                <View className="items-center py-10">
                  <MotiView
                    from={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200 }}
                    className="w-20 h-20 rounded-full bg-success/15 items-center justify-center mb-5"
                  >
                    <Check size={40} color={colors.success} strokeWidth={3} />
                  </MotiView>
                  <Text variant="title" className="text-xl">
                    Payment successful
                  </Text>
                </View>
              ) : stage === "failed" ? (
                <View className="items-center py-8">
                  <View className="w-20 h-20 rounded-full bg-danger/15 items-center justify-center mb-5">
                    <X size={40} color={colors.danger} strokeWidth={3} />
                  </View>
                  <Text variant="title" className="text-xl mb-6">
                    Payment didn't go through
                  </Text>
                  <Button title="Close" variant="outline" onPress={close} />
                </View>
              ) : session?.provider === "PAYPUR" || session?.provider === "CASHFREE" ? (
                <View className="items-center">
                  <View className="bg-white rounded-3xl p-5 mb-5">
                    {session.upiIntent ? (
                      <QRCode
                        value={session.upiIntent}
                        size={220}
                        color="#0A0A0A"
                        backgroundColor="#FFFFFF"
                      />
                    ) : (
                      <ActivityIndicator color="#0A0A0A" />
                    )}
                  </View>
                  <Text variant="muted" className="text-sm mb-6">
                    Scan with any UPI app
                  </Text>

                  <View className="flex-row items-center w-full mb-5">
                    <View className="flex-1 h-px bg-line" />
                    <Text variant="muted" className="text-[11px] tracking-widest uppercase mx-3">
                      or
                    </Text>
                    <View className="flex-1 h-px bg-line" />
                  </View>

                  <View className="w-full">
                    <Button
                      title="Pay with UPI app"
                      onPress={() => session.upiIntent && Linking.openURL(session.upiIntent)}
                    />
                  </View>

                  <View className="flex-row items-center gap-2 mt-5">
                    <MotiView
                      from={{ opacity: 0.3 }}
                      animate={{ opacity: 1 }}
                      transition={{ loop: true, type: "timing", duration: 800 }}
                      className="w-2 h-2 rounded-full bg-primary"
                    />
                    <Text variant="muted" className="text-sm">
                      Waiting for payment…
                    </Text>
                  </View>
                </View>
              ) : stripeOpen && session ? (
                <View className="h-[460px] rounded-2xl overflow-hidden">
                  <WebView source={{ uri: session.redirectUrl }} />
                </View>
              ) : (
                <View className="items-center pb-2">
                  <View className="flex-row items-start gap-2.5 mb-6 p-4 rounded-2xl bg-surface w-full">
                    <ExternalLink size={16} color={colors.accent} style={{ marginTop: 2 }} />
                    <Text variant="muted" className="text-sm flex-1 leading-relaxed">
                      You'll complete payment on Stripe's secure page. We'll confirm automatically.
                    </Text>
                  </View>
                  <View className="w-full">
                    <Button title="Continue to payment" onPress={() => setStripeOpen(true)} />
                  </View>
                </View>
              )}
            </MotiView>
          )}
        </AnimatePresence>
      </View>
    </Modal>
  )
}
