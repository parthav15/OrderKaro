import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
} from "react-native"
import { CameraView, useCameraPermissions } from "expo-camera"
import { Redirect, useRouter } from "expo-router"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors, typography, spacing, radii } from "@/constants/theme"
import { useAuthStore } from "@/stores/auth"
import { useCartStore } from "@/stores/cart"
import api from "@/lib/api"
import Button from "@/components/ui/Button"

const { width } = Dimensions.get("window")
const SCANNER_SIZE = width * 0.7

export default function ScannerScreen() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const setCanteen = useAuthStore((s) => s.setCanteen)
  const setCartContext = useCartStore((s) => s.setContext)
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [loading, setLoading] = useState(false)

  const cornerOpacity = useSharedValue(0.6)

  useEffect(() => {
    cornerOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.ease }),
        withTiming(0.6, { duration: 1000, easing: Easing.ease })
      ),
      -1
    )
  }, [])

  const cornerStyle = useAnimatedStyle(() => ({
    opacity: cornerOpacity.value,
  }))

  if (!user) {
    return <Redirect href="/identify" />
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return
    setScanned(true)
    setLoading(true)

    try {
      let qrToken = data
      if (data.includes("/")) {
        const url = new URL(data)
        const params = new URLSearchParams(url.search)
        qrToken = params.get("table") || data.split("/").pop() || data
      }

      const { data: result } = await api.get(
        `/api/v1/public/resolve-qr/${qrToken}`
      )

      const { canteen, table } = result.data

      setCanteen({
        canteenId: canteen.id,
        canteenSlug: canteen.slug,
        canteenName: canteen.name,
        tableId: table.id,
        tableLabel: table.label,
      })
      setCartContext(canteen.id, table.id)

      router.push("/(tabs)/menu")
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Invalid QR code. Please try again."
      Alert.alert("Scan Error", message)
      setScanned(false)
    } finally {
      setLoading(false)
    }
  }

  if (!permission) {
    return <View style={styles.container} />
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.title}>OrderKaro</Text>
          <Text style={styles.subtitle}>
            Camera access is needed to scan QR codes at tables
          </Text>
          <Button
            title="Allow Camera Access"
            onPress={requestPermission}
            size="lg"
            fullWidth
          />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      <View style={styles.overlay}>
        <SafeAreaView style={styles.overlayContent}>
          <Text style={styles.scanTitle}>OrderKaro</Text>
          <Text style={styles.scanSubtitle}>
            Scan the QR code on your table
          </Text>

          <View style={styles.scannerFrame}>
            <Animated.View style={[styles.corner, styles.topLeft, cornerStyle]} />
            <Animated.View style={[styles.corner, styles.topRight, cornerStyle]} />
            <Animated.View style={[styles.corner, styles.bottomLeft, cornerStyle]} />
            <Animated.View style={[styles.corner, styles.bottomRight, cornerStyle]} />
          </View>

          {loading && (
            <View style={styles.loadingBanner}>
              <Text style={styles.loadingText}>Loading menu...</Text>
            </View>
          )}

          {scanned && !loading && (
            <Button
              title="Scan Again"
              onPress={() => setScanned(false)}
              variant="outline"
              style={styles.scanAgainButton}
            />
          )}
        </SafeAreaView>
      </View>
    </View>
  )
}

const CORNER_SIZE = 30
const CORNER_WIDTH = 4

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing["3xl"],
    gap: spacing.lg,
  },
  title: {
    fontSize: typography.sizes["4xl"],
    fontWeight: typography.weights.extrabold,
    color: colors.red,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.neutral[500],
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  overlayContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
  },
  scanTitle: {
    fontSize: typography.sizes["3xl"],
    fontWeight: typography.weights.extrabold,
    color: colors.white,
  },
  scanSubtitle: {
    fontSize: typography.sizes.md,
    color: colors.neutral[300],
  },
  scannerFrame: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: colors.red,
    borderTopLeftRadius: radii.sm,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: colors.red,
    borderTopRightRadius: radii.sm,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: colors.red,
    borderBottomLeftRadius: radii.sm,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: colors.red,
    borderBottomRightRadius: radii.sm,
  },
  loadingBanner: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
  },
  loadingText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.black,
  },
  scanAgainButton: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderColor: colors.white,
  },
})
