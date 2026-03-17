import { View, StyleSheet } from "react-native"
import { colors } from "@/constants/theme"

interface VegBadgeProps {
  isVeg: boolean
  size?: number
}

export default function VegBadge({ isVeg, size = 16 }: VegBadgeProps) {
  const borderColor = isVeg ? colors.veg : colors.nonVeg
  const dotSize = size * 0.5

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderColor,
          borderRadius: size * 0.15,
        },
      ]}
    >
      <View
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: borderColor,
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
})
