import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import Animated, { FadeInDown } from "react-native-reanimated"
import { colors, typography, spacing, radii } from "@/constants/theme"
import { useAuthStore } from "@/stores/auth"
import api from "@/lib/api"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"

export default function IdentifyScreen() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})

  const validate = () => {
    const e: typeof errors = {}
    if (!name.trim()) e.name = "Name is required"
    if (name.trim().length < 1) e.name = "Name is required"
    if (!/^\d{10}$/.test(phone)) e.phone = "Enter a valid 10-digit phone number"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)

    try {
      const { data } = await api.post("/api/v1/public/identify", {
        name: name.trim(),
        phone,
      })

      const { consumer, accessToken } = data.data

      setAuth(
        {
          id: consumer.id,
          name: consumer.name,
          phone: consumer.phone,
          role: "CONSUMER",
        },
        accessToken
      )

      router.replace("/")
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Something went wrong. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <Text style={styles.title}>OrderKaro</Text>
          <Text style={styles.subtitle}>Enter your details to get started</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.form}>
          <Input
            label="Your Name"
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            error={errors.name}
            autoCapitalize="words"
          />

          <Input
            label="Phone Number"
            placeholder="10-digit phone number"
            value={phone}
            onChangeText={(text) => setPhone(text.replace(/\D/g, "").slice(0, 10))}
            error={errors.phone}
            keyboardType="phone-pad"
            maxLength={10}
          />

          <Button
            title="Continue"
            onPress={handleSubmit}
            loading={loading}
            fullWidth
            size="lg"
            style={styles.submitButton}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing["3xl"],
  },
  header: {
    alignItems: "center",
    marginBottom: spacing["4xl"],
  },
  title: {
    fontSize: typography.sizes["4xl"],
    fontWeight: typography.weights.extrabold,
    color: colors.red,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.neutral[500],
    marginTop: spacing.sm,
  },
  form: {
    gap: spacing.xl,
  },
  submitButton: {
    marginTop: spacing.md,
  },
})
