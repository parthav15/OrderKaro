import { useState } from "react"
import { View, Modal, Pressable, Linking, ActivityIndicator } from "react-native"
import { MotiView, AnimatePresence } from "moti"
import QRCode from "react-native-qrcode-svg"
import { WebView, type WebViewMessageEvent } from "react-native-webview"
import * as Haptics from "expo-haptics"
import { Check, X, ExternalLink, CreditCard, QrCode as QrCodeIcon } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/theme/theme-provider"
import { usePaymentPolling } from "@/lib/use-payment-polling"
import type { PaymentSession } from "@/lib/types"

const SYMBOLS: Record<string, string> = { INR: "₹", USD: "$", GBP: "£", EUR: "€" }

function money(amount: number, currency: string) {
  return `${SYMBOLS[currency] ?? currency + " "}${amount}`
}

interface CashfreeCheckoutSession extends PaymentSession {
  paymentSessionId?: string | null
  cashfreeMode?: "sandbox" | "production"
}

function cashfreeCheckoutHtml(paymentSessionId: string, mode: "sandbox" | "production", bg: string, ink: string) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>
html,body{margin:0;height:100%;background:${bg}}
body{display:flex;align-items:center;justify-content:center;font-family:-apple-system,sans-serif;color:${ink};font-size:14px}
</style>
</head><body>
<div id="status">Loading secure checkout…</div>
<script>
function post(payload) {
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(payload))
}
window.addEventListener("error", function (e) {
  if (e && e.target && e.target.tagName === "SCRIPT") post({ type: "sdk_error" })
}, true)
</script>
<script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
<script>
try {
  if (typeof Cashfree === "undefined") {
    post({ type: "sdk_error" })
  } else {
    var cashfree = Cashfree({ mode: "${mode}" })
    cashfree.checkout({
      paymentSessionId: "${paymentSessionId}",
      redirectTarget: "_modal",
    }).then(function (result) {
      post({ type: "result", paid: !!(result && result.paymentDetails), error: (result && result.error && result.error.message) || null })
    }).catch(function (err) {
      post({ type: "result", paid: false, error: err && err.message })
    })
  }
} catch (e) {
  post({ type: "sdk_error" })
}
</script>
</body></html>`
}

export function PaymentSheet({
  session,
  title,
  onSuccess,
  onClose,
}: {
  session: CashfreeCheckoutSession | null
  title: string
  onSuccess: (data: Record<string, unknown>) => void
  onClose: () => void
}) {
  const { colors } = useTheme()
  const [stage, setStage] = useState<"paying" | "success" | "failed">("paying")
  const [stripeOpen, setStripeOpen] = useState(false)
  const [cashfreeMethod, setCashfreeMethod] = useState<"upi" | "card">("upi")
  const [cardSdkError, setCardSdkError] = useState(false)
  const open = !!session

  function handleCashfreeMessage(event: WebViewMessageEvent) {
    try {
      const payload = JSON.parse(event.nativeEvent.data)
      if (payload?.type === "sdk_error") setCardSdkError(true)
    } catch {
      return
    }
  }

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
    setCashfreeMethod("upi")
    setCardSdkError(false)
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
                  {session.provider === "CASHFREE" && session.paymentSessionId ? (
                    <View className="flex-row bg-canvas rounded-full p-1 mb-5 w-full">
                      <Pressable
                        onPress={() => setCashfreeMethod("upi")}
                        className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-full ${cashfreeMethod === "upi" ? "bg-surface-elevated" : ""}`}
                      >
                        <QrCodeIcon size={14} color={cashfreeMethod === "upi" ? colors.primary : colors.muted} />
                        <Text variant={cashfreeMethod === "upi" ? "label" : "muted"} className="text-sm">
                          UPI
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setCashfreeMethod("card")}
                        className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-full ${cashfreeMethod === "card" ? "bg-surface-elevated" : ""}`}
                      >
                        <CreditCard size={14} color={cashfreeMethod === "card" ? colors.primary : colors.muted} />
                        <Text variant={cashfreeMethod === "card" ? "label" : "muted"} className="text-sm">
                          Card
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}

                  {cashfreeMethod === "card" && session.provider === "CASHFREE" && session.paymentSessionId ? (
                    cardSdkError ? (
                      <View className="items-center py-10 w-full">
                        <Text variant="muted" className="text-sm text-center mb-5">
                          Card payment isn't available right now. Please use UPI instead.
                        </Text>
                        <Button
                          title="Switch to UPI"
                          variant="outline"
                          onPress={() => {
                            setCardSdkError(false)
                            setCashfreeMethod("upi")
                          }}
                        />
                      </View>
                    ) : (
                      <View
                        style={{ backgroundColor: colors.surface }}
                        className="w-full h-[460px] rounded-2xl overflow-hidden mb-2"
                      >
                        <WebView
                          source={{
                            html: cashfreeCheckoutHtml(
                              session.paymentSessionId,
                              session.cashfreeMode ?? "sandbox",
                              colors.surface,
                              colors.ink
                            ),
                          }}
                          onMessage={handleCashfreeMessage}
                          onError={() => setCardSdkError(true)}
                          style={{ flex: 1, backgroundColor: colors.surface }}
                          originWhitelist={["*"]}
                        />
                      </View>
                    )
                  ) : (
                    <>
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
                    </>
                  )}

                  {!(cashfreeMethod === "card" && cardSdkError) ? (
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
                  ) : null}
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
