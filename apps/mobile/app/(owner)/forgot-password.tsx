import { useEffect, useRef, useState } from "react"
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { useRouter } from "expo-router"
import { MotiView } from "moti"
import { SafeAreaView } from "react-native-safe-area-context"
import { ArrowLeft, Eye, EyeOff } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { DismissKeyboard } from "@/components/ui/dismiss-keyboard"
import { ownerForgotPassword, ownerResetPassword } from "@/lib/owner-auth"
import { useTheme } from "@/theme/theme-provider"

const RESEND_SECONDS = 30

function CodeBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<TextInput>(null)
  const { colors } = useTheme()

  useEffect(() => {
    const t = setTimeout(() => ref.current?.focus(), 350)
    return () => clearTimeout(t)
  }, [])

  return (
    <Pressable onPress={() => ref.current?.focus()} className="flex-row justify-between">
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, "").slice(0, 6))}
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

export default function OwnerForgotPassword() {
  const router = useRouter()
  const { colors } = useTheme()
  const [step, setStep] = useState<"email" | "reset">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [phoneHint, setPhoneHint] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendIn, setResendIn] = useState(0)

  useEffect(() => {
    if (resendIn <= 0) return
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [resendIn])

  function goBack() {
    if (router.canGoBack()) router.back()
    else router.replace("/(owner)")
  }

  async function sendCode() {
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Enter a valid email")
      return
    }
    setLoading(true)
    setError("")
    try {
      const hint = await ownerForgotPassword(email.trim())
      setPhoneHint(hint)
      setCode("")
      setStep("reset")
      setResendIn(RESEND_SECONDS)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send the code")
    } finally {
      setLoading(false)
    }
  }

  async function reset() {
    if (!/^\d{6}$/.test(code) || password.length < 8) return
    setLoading(true)
    setError("")
    try {
      await ownerResetPassword(email.trim(), code, password)
      router.replace("/(owner)/(tabs)/orders")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't reset your password")
      setCode("")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="px-5 pt-1">
          <Pressable
            onPress={goBack}
            className="w-10 h-10 rounded-full bg-surface border border-line items-center justify-center"
          >
            <ArrowLeft size={18} color={colors.ink} />
          </Pressable>
        </View>

        <DismissKeyboard>
          <ScrollView
            contentContainerStyle={{ padding: 20, paddingTop: 12, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            {step === "email" ? (
              <MotiView
                key="email"
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 500 }}
              >
                <Text className="text-accent tracking-[4px] text-xs font-sans-semibold mb-3">
                  RESET PASSWORD
                </Text>
                <Text variant="display" className="text-4xl leading-tight mb-1">
                  Forgot your
                </Text>
                <Text variant="display" className="text-4xl leading-tight text-primary mb-3">
                  password?
                </Text>
                <Text variant="muted" className="text-base mb-8">
                  Enter your email and we'll text a reset code to the phone on file.
                </Text>

                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className="h-14 rounded-2xl bg-surface border border-line px-5 text-ink font-sans-medium text-base"
                />

                {error ? (
                  <Text className="text-danger font-sans-medium text-sm mt-4">{error}</Text>
                ) : null}

                <View className="mt-6">
                  <Button
                    title="Send reset code"
                    loading={loading}
                    disabled={!/\S+@\S+\.\S+/.test(email)}
                    onPress={sendCode}
                  />
                </View>
              </MotiView>
            ) : (
              <MotiView
                key="reset"
                from={{ opacity: 0, translateX: 24 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: "timing", duration: 500 }}
              >
                <Text className="text-accent tracking-[4px] text-xs font-sans-semibold mb-3">
                  RESET PASSWORD
                </Text>
                <Text variant="display" className="text-4xl leading-tight mb-1">
                  Enter code &
                </Text>
                <Text variant="display" className="text-4xl leading-tight text-primary mb-3">
                  new password.
                </Text>
                <Text variant="muted" className="text-sm mb-7">
                  {phoneHint ? `Code sent to ${phoneHint}` : "Code sent to your phone"}
                </Text>

                <CodeBoxes value={code} onChange={setCode} />

                <View className="relative justify-center mt-4">
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="New password (min 8 characters)"
                    placeholderTextColor={colors.muted}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    className="h-14 rounded-2xl bg-surface border border-line pl-5 pr-14 text-ink font-sans-medium text-base"
                  />
                  <Pressable
                    onPress={() => setShowPassword((s) => !s)}
                    className="absolute right-4 h-full justify-center"
                  >
                    {showPassword ? (
                      <EyeOff size={18} color={colors.muted} />
                    ) : (
                      <Eye size={18} color={colors.muted} />
                    )}
                  </Pressable>
                </View>

                {error ? (
                  <Text className="text-danger font-sans-medium text-sm mt-4 text-center">{error}</Text>
                ) : null}

                <View className="mt-6">
                  <Button
                    title="Reset password"
                    loading={loading}
                    disabled={code.length !== 6 || password.length < 8}
                    onPress={reset}
                  />
                </View>

                <View className="flex-row justify-between items-center mt-6">
                  <Pressable
                    onPress={() => {
                      setStep("email")
                      setCode("")
                      setError("")
                    }}
                  >
                    <Text variant="muted" className="text-sm font-sans-semibold">
                      Change email
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
          </ScrollView>
        </DismissKeyboard>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
