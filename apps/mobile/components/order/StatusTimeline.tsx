import { View, Text, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Animated, { FadeIn } from "react-native-reanimated"
import { colors, typography, spacing } from "@/constants/theme"
import { formatTime } from "@/lib/utils"

interface TimelineStep {
  label: string
  timestamp: string | null
  icon: keyof typeof Ionicons.glyphMap
}

interface StatusTimelineProps {
  status: string
  placedAt: string
  acceptedAt: string | null
  preparingAt: string | null
  readyAt: string | null
  pickedUpAt: string | null
  cancelledAt: string | null
}

const STEPS: Array<{ key: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: "PLACED", label: "Order Placed", icon: "receipt-outline" },
  { key: "ACCEPTED", label: "Accepted", icon: "checkmark-circle-outline" },
  { key: "PREPARING", label: "Preparing", icon: "flame-outline" },
  { key: "READY", label: "Ready for Pickup", icon: "bag-check-outline" },
  { key: "PICKED_UP", label: "Picked Up", icon: "checkmark-done-outline" },
]

const STATUS_ORDER = ["PLACED", "ACCEPTED", "PREPARING", "READY", "PICKED_UP"]

export default function StatusTimeline({
  status,
  placedAt,
  acceptedAt,
  preparingAt,
  readyAt,
  pickedUpAt,
  cancelledAt,
}: StatusTimelineProps) {
  const timestamps: Record<string, string | null> = {
    PLACED: placedAt,
    ACCEPTED: acceptedAt,
    PREPARING: preparingAt,
    READY: readyAt,
    PICKED_UP: pickedUpAt,
  }

  const currentIndex = STATUS_ORDER.indexOf(status)
  const isCancelled = status === "CANCELLED"

  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => {
        const isCompleted = currentIndex >= index && !isCancelled
        const isCurrent = currentIndex === index && !isCancelled
        const timestamp = timestamps[step.key]

        return (
          <Animated.View
            key={step.key}
            entering={FadeIn.duration(300).delay(index * 100)}
            style={styles.step}
          >
            <View style={styles.iconColumn}>
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.completedCircle,
                  isCurrent && styles.currentCircle,
                ]}
              >
                <Ionicons
                  name={step.icon}
                  size={16}
                  color={isCompleted ? colors.white : colors.neutral[400]}
                />
              </View>
              {index < STEPS.length - 1 && (
                <View
                  style={[
                    styles.line,
                    isCompleted && currentIndex > index && styles.completedLine,
                  ]}
                />
              )}
            </View>

            <View style={styles.content}>
              <Text
                style={[
                  styles.label,
                  isCompleted && styles.completedLabel,
                  isCurrent && styles.currentLabel,
                ]}
              >
                {step.label}
              </Text>
              {timestamp && (
                <Text style={styles.time}>{formatTime(timestamp)}</Text>
              )}
            </View>
          </Animated.View>
        )
      })}

      {isCancelled && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.step}>
          <View style={styles.iconColumn}>
            <View style={[styles.circle, styles.cancelledCircle]}>
              <Ionicons name="close" size={16} color={colors.white} />
            </View>
          </View>
          <View style={styles.content}>
            <Text style={[styles.label, styles.cancelledLabel]}>Cancelled</Text>
            {cancelledAt && (
              <Text style={styles.time}>{formatTime(cancelledAt)}</Text>
            )}
          </View>
        </Animated.View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  step: {
    flexDirection: "row",
    minHeight: 48,
  },
  iconColumn: {
    alignItems: "center",
    width: 36,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
    alignItems: "center",
    justifyContent: "center",
  },
  completedCircle: {
    backgroundColor: colors.success,
  },
  currentCircle: {
    backgroundColor: colors.red,
  },
  cancelledCircle: {
    backgroundColor: colors.red,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.neutral[200],
    marginVertical: 2,
  },
  completedLine: {
    backgroundColor: colors.success,
  },
  content: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.base,
    color: colors.neutral[400],
    fontWeight: typography.weights.medium,
  },
  completedLabel: {
    color: colors.neutral[600],
  },
  currentLabel: {
    color: colors.black,
    fontWeight: typography.weights.bold,
  },
  cancelledLabel: {
    color: colors.red,
    fontWeight: typography.weights.bold,
  },
  time: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[400],
    marginTop: 2,
  },
})
