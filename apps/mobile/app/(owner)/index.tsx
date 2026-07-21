import { useEffect, useState } from "react"
import { View, TextInput } from "react-native"
import { useRouter } from "expo-router"
import { MotiView } from "moti"
import { Screen } from "@/components/ui/screen"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { ownerLogin, getOwnerToken } from "@/lib/owner-auth"
import { DismissKeyboard } from "@/components/ui/dismiss-keyboard"
import { useTheme } from "@/theme/theme-provider"

export default function OwnerLogin() {
  const router = useRouter()
  const { colors } = useTheme()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    getOwnerToken().then((token) => {
      if (token) router.replace("/(owner)/dashboard")
    })
  }, [])

  async function submit() {
    if (!email.trim() || !password) return
    setLoading(true)
    setError("")
    try {
      await ownerLogin(email.trim(), password)
      router.replace("/(owner)/dashboard")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
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

          <View className="gap-3 mb-6">
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
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.muted}
              secureTextEntry
              className="h-14 rounded-2xl bg-surface border border-line px-5 text-ink font-sans-medium text-base"
            />
          </View>

          {error ? (
            <Text className="text-danger font-sans-medium text-sm mb-4">{error}</Text>
          ) : null}

          <Button
            title="Sign in"
            loading={loading}
            disabled={!email.trim() || !password}
            onPress={submit}
          />
        </MotiView>
      </View>
      </DismissKeyboard>
    </Screen>
  )
}
