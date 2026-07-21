import { useState } from "react"
import { View, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { CameraView, useCameraPermissions } from "expo-camera"
import { MotiView } from "moti"
import { X, ScanLine } from "lucide-react-native"
import { Screen } from "@/components/ui/screen"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/theme/theme-provider"

function parseQr(raw: string): { slug: string; table?: string } | null {
  try {
    const url = new URL(raw)
    const parts = url.pathname.split("/").filter(Boolean)
    const menuIndex = parts.indexOf("menu")
    const slug = menuIndex > 0 ? parts[menuIndex - 1] : parts[0]
    if (!slug) return null
    const table = url.searchParams.get("table") ?? undefined
    return { slug, table }
  } catch {
    const clean = raw.trim().toLowerCase()
    return /^[a-z0-9-]+$/.test(clean) ? { slug: clean } : null
  }
}

export default function Scan() {
  const router = useRouter()
  const { colors } = useTheme()
  const [permission, requestPermission] = useCameraPermissions()
  const [handled, setHandled] = useState(false)

  function onScan(data: string) {
    if (handled) return
    const parsed = parseQr(data)
    if (!parsed) return
    setHandled(true)
    router.replace({
      pathname: "/(diner)/r/[slug]/menu",
      params: { slug: parsed.slug, ...(parsed.table ? { table: parsed.table } : {}) },
    })
  }

  if (!permission) {
    return <Screen><View className="flex-1" /></Screen>
  }

  if (!permission.granted) {
    return (
      <Screen>
        <View className="flex-1 justify-center">
          <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center mb-4">
            <ScanLine size={22} color={colors.primary} />
          </View>
          <Text variant="heading" className="text-2xl mb-2">
            Scan a table QR
          </Text>
          <Text variant="muted" className="text-base leading-relaxed mb-6">
            Allow camera access to scan the QR code on your table and open its menu instantly.
          </Text>
          <Button title="Allow camera" onPress={requestPermission} />
          <View className="h-3" />
          <Button title="Back" variant="ghost" onPress={() => router.back()} />
        </View>
      </Screen>
    )
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={({ data }) => onScan(data)}
      />
      <View className="absolute inset-0 items-center justify-center">
        <MotiView
          from={{ opacity: 0.4, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ loop: true, type: "timing", duration: 1200 }}
          className="w-64 h-64 rounded-3xl border-2 border-white/80"
        />
      </View>
      <View className="absolute top-16 left-5 right-5 flex-row items-center justify-between">
        <Text className="text-white font-sans-semibold text-base">Point at the table QR</Text>
        <Pressable
          onPress={() => router.back()}
          className="w-11 h-11 rounded-full bg-white/15 items-center justify-center"
        >
          <X size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  )
}
