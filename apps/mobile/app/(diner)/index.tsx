import { useEffect, useState } from "react"
import { View, TextInput } from "react-native"
import { useRouter } from "expo-router"
import { MotiView } from "moti"
import { Screen } from "@/components/ui/screen"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { identify, getIdentity } from "@/lib/auth"
import { registerForPushNotifications } from "@/lib/push"
import { useTheme } from "@/theme/theme-provider"

export default function DinerEntry() {
  const router = useRouter()
  const { colors } = useTheme()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    getIdentity().then((identity) => {
      if (identity) {
        setName(identity.name)
        setPhone(identity.phone)
      }
    })
  }, [])

  const valid = name.trim().length > 0 && /^\d{10}$/.test(phone)

  async function handleContinue() {
    if (!valid) return
    setLoading(true)
    setError("")
    try {
      await identify(name.trim(), phone)
      registerForPushNotifications()
      router.replace("/(diner)/discover")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <View className="flex-1 justify-center">
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600 }}
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

          <Button
            title="Continue"
            loading={loading}
            disabled={!valid}
            onPress={handleContinue}
          />
        </MotiView>
      </View>
    </Screen>
  )
}
