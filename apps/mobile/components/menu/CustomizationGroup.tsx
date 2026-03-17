import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import { colors, typography, spacing, radii } from "@/constants/theme"
import { formatPrice } from "@/lib/utils"

interface Option {
  id: string
  name: string
  priceAdjustment: number
  isDefault: boolean
}

interface CustomizationGroupProps {
  name: string
  type: "SINGLE_SELECT" | "MULTI_SELECT"
  isRequired: boolean
  options: Option[]
  selectedIds: string[]
  onToggle: (optionId: string) => void
}

export default function CustomizationGroup({
  name,
  type,
  isRequired,
  options,
  selectedIds,
  onToggle,
}: CustomizationGroupProps) {
  const handleToggle = (optionId: string) => {
    Haptics.selectionAsync()
    onToggle(optionId)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{name}</Text>
        {isRequired && <Text style={styles.required}>Required</Text>}
        {!isRequired && <Text style={styles.optional}>Optional</Text>}
      </View>
      <Text style={styles.hint}>
        {type === "SINGLE_SELECT" ? "Select one" : "Select one or more"}
      </Text>

      <View style={styles.options}>
        {options.map((option) => {
          const isSelected = selectedIds.includes(option.id)
          return (
            <TouchableOpacity
              key={option.id}
              onPress={() => handleToggle(option.id)}
              style={styles.optionRow}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <Ionicons
                  name={
                    type === "SINGLE_SELECT"
                      ? isSelected
                        ? "radio-button-on"
                        : "radio-button-off"
                      : isSelected
                        ? "checkbox"
                        : "square-outline"
                  }
                  size={22}
                  color={isSelected ? colors.red : colors.neutral[400]}
                />
                <Text
                  style={[
                    styles.optionName,
                    isSelected && styles.optionNameSelected,
                  ]}
                >
                  {option.name}
                </Text>
              </View>
              {option.priceAdjustment > 0 && (
                <Text style={styles.optionPrice}>
                  +{formatPrice(option.priceAdjustment)}
                </Text>
              )}
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.black,
  },
  required: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.red,
  },
  optional: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.neutral[400],
  },
  hint: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
  },
  options: {
    gap: spacing.xs,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  optionName: {
    fontSize: typography.sizes.base,
    color: colors.neutral[600],
  },
  optionNameSelected: {
    color: colors.black,
    fontWeight: typography.weights.medium,
  },
  optionPrice: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[500],
    fontWeight: typography.weights.medium,
  },
})
