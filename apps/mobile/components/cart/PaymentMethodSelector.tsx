import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated"
import * as Haptics from "expo-haptics"
import { colors, typography, spacing, radii } from "@/constants/theme"

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity)

type PaymentMethod = "CASH" | "WALLET"

interface PaymentMethodSelectorProps {
  selected: PaymentMethod
  onSelect: (method: PaymentMethod) => void
  walletBalance?: number
}

export default function PaymentMethodSelector({
  selected,
  onSelect,
  walletBalance,
}: PaymentMethodSelectorProps) {
  const handleSelect = (method: PaymentMethod) => {
    Haptics.selectionAsync()
    onSelect(method)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Payment Method</Text>
      <View style={styles.options}>
        <TouchableOpacity
          onPress={() => handleSelect("CASH")}
          style={[styles.option, selected === "CASH" && styles.selected]}
          activeOpacity={0.7}
        >
          <Ionicons
            name="cash-outline"
            size={20}
            color={selected === "CASH" ? colors.red : colors.neutral[500]}
          />
          <Text
            style={[styles.optionText, selected === "CASH" && styles.selectedText]}
          >
            Cash
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleSelect("WALLET")}
          style={[styles.option, selected === "WALLET" && styles.selected]}
          activeOpacity={0.7}
        >
          <Ionicons
            name="wallet-outline"
            size={20}
            color={selected === "WALLET" ? colors.red : colors.neutral[500]}
          />
          <View>
            <Text
              style={[
                styles.optionText,
                selected === "WALLET" && styles.selectedText,
              ]}
            >
              Wallet
            </Text>
            {walletBalance !== undefined && (
              <Text style={styles.balance}>\u20B9{walletBalance}</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  label: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.black,
  },
  options: {
    flexDirection: "row",
    gap: spacing.md,
  },
  option: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radii.lg,
  },
  selected: {
    borderColor: colors.red,
    backgroundColor: "#FEF2F2",
  },
  optionText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.neutral[600],
  },
  selectedText: {
    color: colors.red,
  },
  balance: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[400],
  },
})
