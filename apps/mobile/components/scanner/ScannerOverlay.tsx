import { View, Text, StyleSheet, Dimensions } from "react-native"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated"
import { useEffect } from "react"
import { colors, typography, spacing, radii } from "@/constants/theme"

const { width } = Dimensions.get("window")
const SCANNER_SIZE = width * 0.7

interface ScannerOverlayProps {
  title?: string
  subtitle?: string
}

export default function ScannerOverlay({
  title = "Scan QR Code",
  subtitle = "Point your camera at the QR code on the table",
}: ScannerOverlayProps) {
  const linePosition = useSharedValue(0)

  useEffect(() => {
    linePosition.value = withRepeat(
      withTiming(SCANNER_SIZE - 4, { duration: 2000, easing: Easing.linear }),
      -1,
      true
    )
  }, [])

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: linePosition.value }],
  }))

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.scannerFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          <Animated.View style={[styles.scanLine, lineStyle]} />
        </View>
      </View>
    </View>
  )
}

const CORNER_SIZE = 24
const CORNER_WIDTH = 3

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[300],
    textAlign: "center",
    paddingHorizontal: spacing["3xl"],
  },
  scannerFrame: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    position: "relative",
    overflow: "hidden",
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
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: colors.red,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: colors.red,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: colors.red,
  },
  scanLine: {
    position: "absolute",
    left: 4,
    right: 4,
    height: 2,
    backgroundColor: colors.red,
    opacity: 0.7,
  },
})
