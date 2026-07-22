import { useEffect, useState } from "react"
import { View, TextInput, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { MotiView } from "moti"
import { ArrowLeft, Eye, EyeOff } from "lucide-react-native"
import { Screen } from "@/components/ui/screen"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { ownerLogin, getOwnerToken } from "@/lib/owner-auth"
import { DismissKeyboard } from "@/components/ui/dismiss-keyboard"
import { useTheme } from "@/theme/theme-provider"

export default function OwnerLogin() {
  const router = useRouter()
  const { colors } = useTheme()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    getOwnerToken().then((token) => {
      if (token) router.replace("/(owner)/(tabs)/orders")
    })
  }, [])

  function goBack() {
    if (router.canGoBack()) router.back()
    else router.replace("/")
  }

  async function submit() {
    if (!email.trim() || !password) return
    setLoading(true)
    setError("")
    try {
      await ownerLogin(email.trim(), password)
      router.replace("/(owner)/(tabs)/orders")
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
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600 }}
          >
            <Text className="text-accent tracking-[4px] text-xs font-sans-semibold mb-3">
              RESTAURANT CONSOLE
            </Text>
            <Text variant="display" className="text-4xl leading-tight mb-1">
              Welcome
            </Text>
            <Text variant="display" className="text-4xl leading-tight text-primary mb-10">
              back.
            </Text>

            <View className="gap-3">
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                keyboardType="email-address"
                className="h-14 rounded-2xl bg-surface border border-line px-5 text-ink font-sans-medium text-base"
              />
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
            </View>

            <Pressable
              onPress={() => router.push("/(owner)/forgot-password")}
              className="self-end mt-3"
            >
              <Text variant="label" className="text-sm text-accent">
                Forgot password?
              </Text>
            </Pressable>

            {error ? (
              <Text className="text-danger font-sans-medium text-sm mt-4">{error}</Text>
            ) : null}

            <View className="mt-5">
              <Button
                title="Sign in"
                loading={loading}
                disabled={!email.trim() || !password}
                onPress={submit}
              />
            </View>

            <Pressable
              onPress={() => router.push("/(owner)/register")}
              className="mt-7 items-center"
            >
              <Text variant="muted" className="text-sm">
                New to Vision Menu?{" "}
                <Text variant="label" className="text-sm text-accent">
                  Create an account
                </Text>
              </Text>
            </Pressable>
          </MotiView>
        </View>
      </DismissKeyboard>
    </Screen>
  )
}
