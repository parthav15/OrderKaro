import { useEffect, useState } from "react"
import { View, TextInput, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { MotiView } from "moti"
import { ArrowLeft, Eye, EyeOff, ChefHat, AtSign } from "lucide-react-native"
import { Screen } from "@/components/ui/screen"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { DismissKeyboard } from "@/components/ui/dismiss-keyboard"
import { useTheme } from "@/theme/theme-provider"
import { staffLogin, getStaffToken } from "@/lib/staff-auth"

function Field({ delay, children }: { delay: number; children: React.ReactNode }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 420, delay }}
    >
      {children}
    </MotiView>
  )
}

export default function StaffLogin() {
  const router = useRouter()
  const { colors } = useTheme()
  const [handle, setHandle] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    getStaffToken().then((token) => {
      if (token) router.replace("/(kitchen)")
    })
  }, [])

  function goBack() {
    if (router.canGoBack()) router.back()
    else router.replace("/")
  }

  async function submit() {
    const cleanHandle = handle.trim().toLowerCase()
    if (!cleanHandle || !email.trim() || !password) return
    setLoading(true)
    setError("")
    try {
      await staffLogin(cleanHandle, email.trim(), password)
      router.replace("/(kitchen)")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <View className="flex-row items-center justify-between pt-1 pb-1">
        <Pressable
          onPress={goBack}
          className="w-10 h-10 rounded-full bg-surface border border-line items-center justify-center"
        >
          <ArrowLeft size={18} color={colors.ink} />
        </Pressable>
        <ThemeToggle />
      </View>

      <DismissKeyboard>
        <View className="flex-1 justify-center">
          <MotiView
            from={{ opacity: 0, scale: 0.9, rotate: "-8deg" }}
            animate={{ opacity: 1, scale: 1, rotate: "0deg" }}
            transition={{ type: "spring", damping: 14, stiffness: 160 }}
            className="w-14 h-14 rounded-2xl bg-primary/10 items-center justify-center mb-5"
          >
            <ChefHat size={26} color={colors.primary} />
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600, delay: 80 }}
          >
            <Text className="text-accent tracking-[4px] text-xs font-sans-semibold mb-3">
              STAFF ACCESS
            </Text>
            <Text variant="display" className="text-4xl leading-tight mb-1">
              Kitchen
            </Text>
            <Text variant="display" className="text-4xl leading-tight text-primary mb-9">
              sign in.
            </Text>
          </MotiView>

          <View className="gap-3">
            <Field delay={180}>
              <View className="relative justify-center">
                <View className="absolute left-4 z-10">
                  <AtSign size={18} color={colors.muted} />
                </View>
                <TextInput
                  value={handle}
                  onChangeText={setHandle}
                  placeholder="Restaurant handle"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="h-14 rounded-2xl bg-surface border border-line pl-12 pr-5 text-ink font-sans-medium text-base"
                />
              </View>
              <Text variant="muted" className="text-xs mt-1.5 ml-1">
                The restaurant&apos;s handle, e.g. sn-college-canteen
              </Text>
            </Field>

            <Field delay={260}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                keyboardType="email-address"
                className="h-14 rounded-2xl bg-surface border border-line px-5 text-ink font-sans-medium text-base"
              />
            </Field>

            <Field delay={340}>
              <View className="relative justify-center">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
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
            </Field>
          </View>

          {error ? (
            <MotiView
              from={{ opacity: 0, translateY: -6 }}
              animate={{ opacity: 1, translateY: 0 }}
            >
              <Text className="text-danger font-sans-medium text-sm mt-4">{error}</Text>
            </MotiView>
          ) : null}

          <Field delay={420}>
            <View className="mt-5">
              <Button
                title="Open the board"
                loading={loading}
                disabled={!handle.trim() || !email.trim() || !password}
                onPress={submit}
              />
            </View>
          </Field>

          <Field delay={500}>
            <Pressable onPress={() => router.replace("/(owner)")} className="mt-7 items-center">
              <Text variant="muted" className="text-sm">
                Are you the owner?{" "}
                <Text variant="label" className="text-sm text-accent">
                  Sign in here
                </Text>
              </Text>
            </Pressable>
          </Field>
        </View>
      </DismissKeyboard>
    </Screen>
  )
}
