import { useState } from "react"
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
import { ownerRegister } from "@/lib/owner-auth"
import { registerForPushNotifications } from "@/lib/push"
import { useTheme } from "@/theme/theme-provider"

export default function OwnerRegister() {
  const router = useRouter()
  const { colors } = useTheme()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const valid =
    name.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(email) &&
    /^\d{10}$/.test(phone) &&
    password.length >= 8

  async function submit() {
    if (!valid) return
    setLoading(true)
    setError("")
    try {
      await ownerRegister(name.trim(), email.trim(), phone, password)
      registerForPushNotifications()
      router.replace("/(owner)/(tabs)/orders")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create your account")
    } finally {
      setLoading(false)
    }
  }

  function goBack() {
    if (router.canGoBack()) router.back()
    else router.replace("/(owner)")
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
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 600 }}
            >
              <Text className="text-accent tracking-[4px] text-xs font-sans-semibold mb-3">
                RESTAURANT CONSOLE
              </Text>
              <Text variant="display" className="text-4xl leading-tight mb-1">
                Create your
              </Text>
              <Text variant="display" className="text-4xl leading-tight text-primary mb-8">
                account.
              </Text>

              <View className="gap-3">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={colors.muted}
                  className="h-14 rounded-2xl bg-surface border border-line px-5 text-ink font-sans-medium text-base"
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  keyboardType="email-address"
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
                <View className="relative justify-center">
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password (min 8 characters)"
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
              </View>

              {error ? (
                <Text className="text-danger font-sans-medium text-sm mt-4">{error}</Text>
              ) : null}

              <View className="mt-6">
                <Button title="Create account" loading={loading} disabled={!valid} onPress={submit} />
              </View>

              <Pressable onPress={goBack} className="mt-6 items-center">
                <Text variant="muted" className="text-sm">
                  Already have an account?{" "}
                  <Text variant="label" className="text-sm text-accent">
                    Sign in
                  </Text>
                </Text>
              </Pressable>
            </MotiView>
          </ScrollView>
        </DismissKeyboard>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
