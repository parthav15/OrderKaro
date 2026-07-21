import { useEffect, useRef, useState } from "react"
import { View, TextInput, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { MotiView } from "moti"
import { Screen } from "@/components/ui/screen"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { requestOtp, verifyOtp, getToken } from "@/lib/auth"
import { registerForPushNotifications } from "@/lib/push"
import { DismissKeyboard } from "@/components/ui/dismiss-keyboard"
import { useTheme } from "@/theme/theme-provider"

const RESEND_SECONDS = 30

function OtpBoxes({
  value,
  onChange,
  onComplete,
}: {
  value: string
  onChange: (v: string) => void
  onComplete: () => void
}) {
  const ref = useRef<TextInput>(null)

  useEffect(() => {
    const t = setTimeout(() => ref.current?.focus(), 350)
    return () => clearTimeout(t)
  }, [])

  return (
    <Pressable onPress={() => ref.current?.focus()} className="flex-row justify-between">
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => {
          const next = t.replace(/\D/g, "").slice(0, 6)
          onChange(next)
          if (next.length === 6) onComplete()
        }}
        keyboardType="number-pad"
        maxLength={6}
        caretHidden
        className="absolute w-full h-full opacity-0"
      />
      {Array.from({ length: 6 }).map((_, i) => {
        const filled = i < value.length
        const active = i === value.length
        return (
          <View
            key={i}
            className={`w-[46px] h-16 rounded-2xl items-center justify-center border ${
              filled
                ? "bg-primary border-primary"
                : active
                ? "bg-surface border-primary"
                : "bg-surface border-line"
            }`}
          >
            <Text variant="heading" className={`text-2xl ${filled ? "text-[#FFF7F3]" : "text-ink"}`}>
              {value[i] ?? ""}
            </Text>
          </View>
        )
      })}
    </Pressable>
  )
}

export default function DinerEntry() {
  const router = useRouter()
  const { colors } = useTheme()
  const [step, setStep] = useState<"phone" | "code">("phone")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendIn, setResendIn] = useState(0)

  useEffect(() => {
    getToken().then((token) => {
      if (token) router.replace("/(diner)/discover")
    })
  }, [])

  useEffect(() => {
    if (resendIn <= 0) return
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [resendIn])

  const phoneValid = name.trim().length > 0 && /^\d{10}$/.test(phone)

  async function sendCode() {
    if (!phoneValid) return
    setLoading(true)
    setError("")
    try {
      await requestOtp(phone)
      setCode("")
      setStep("code")
      setResendIn(RESEND_SECONDS)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send the code")
    } finally {
      setLoading(false)
    }
  }

  async function verify() {
    if (!/^\d{6}$/.test(code)) return
    setLoading(true)
    setError("")
    try {
      await verifyOtp(name.trim(), phone, code)
      registerForPushNotifications()
      router.replace("/(diner)/discover")
    } catch (e) {
      setError(e instanceof Error ? e.message : "That code didn't work")
      setCode("")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <DismissKeyboard>
        <View className="flex-1 justify-center">
          {step === "phone" ? (
            <MotiView
              key="phone"
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 500 }}
            >
              <Text className="text-accent tracking-[4px] text-xs font-sans-semibold mb-3">
                WELCOME
              </Text>
              <Text variant="display" className="text-4xl leading-tight mb-2">
                Let's get you
              </Text>
              <Text variant="display" className="text-4xl leading-tight text-primary mb-10">
                seated.
              </Text>

              <View className="gap-3 mb-6">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={colors.muted}
                  className="h-14 rounded-2xl bg-surface border border-line px-5 text-ink font-sans-medium text-base"
                />
                <TextInput
                  value={phone}
                  onChangeText={(t) => setPhone(t.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit phone"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  className="h-14 rounded-2xl bg-surface border border-line px-5 text-ink font-sans-medium text-base"
                />
              </View>

              {error ? (
                <Text className="text-danger font-sans-medium text-sm mb-4">{error}</Text>
              ) : null}

              <Button title="Send code" loading={loading} disabled={!phoneValid} onPress={sendCode} />

              <Text variant="muted" className="text-xs text-center mt-6">
                We'll text a one-time code to verify your number.
              </Text>
            </MotiView>
          ) : (
            <MotiView
              key="code"
              from={{ opacity: 0, translateX: 24 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: "timing", duration: 500 }}
            >
              <Text className="text-accent tracking-[4px] text-xs font-sans-semibold mb-3">
                VERIFY
              </Text>
              <Text variant="display" className="text-4xl leading-tight mb-2">
                Enter your
              </Text>
              <Text variant="display" className="text-4xl leading-tight text-primary mb-3">
                code.
              </Text>
              <Text variant="muted" className="text-sm mb-8">
                Sent to +91 {phone}
              </Text>

              <OtpBoxes value={code} onChange={setCode} onComplete={verify} />

              {error ? (
                <Text className="text-danger font-sans-medium text-sm mt-4 text-center">{error}</Text>
              ) : null}

              <View className="mt-8">
                <Button
                  title="Verify & continue"
                  loading={loading}
                  disabled={code.length !== 6}
                  onPress={verify}
                />
              </View>

              <View className="flex-row justify-between items-center mt-6">
                <Pressable
                  onPress={() => {
                    setStep("phone")
                    setCode("")
                    setError("")
                  }}
                >
                  <Text variant="muted" className="text-sm font-sans-semibold">
                    Change number
                  </Text>
                </Pressable>
                <Pressable disabled={resendIn > 0 || loading} onPress={sendCode}>
                  <Text
                    variant="muted"
                    className={`text-sm font-sans-semibold ${resendIn > 0 ? "opacity-40" : "text-accent"}`}
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                  </Text>
                </Pressable>
              </View>
            </MotiView>
          )}
        </View>
      </DismissKeyboard>
    </Screen>
  )
}
