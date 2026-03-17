import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native"
import Animated, { FadeIn } from "react-native-reanimated"
import * as Haptics from "expo-haptics"
import { colors, typography, spacing, radii, shadows } from "@/constants/theme"
import VegBadge from "@/components/ui/VegBadge"
import Badge from "@/components/ui/Badge"
import { formatPrice } from "@/lib/utils"

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  isVeg: boolean
  isAvailable: boolean
  prepTimeMin?: number
  tags: string[]
  customizations: Array<any>
}

interface MenuItemCardProps {
  item: MenuItem
  onPress: () => void
  onQuickAdd: () => void
  cartQuantity: number
}

export default function MenuItemCard({
  item,
  onPress,
  onQuickAdd,
  cartQuantity,
}: MenuItemCardProps) {
  const hasCustomizations = item.customizations && item.customizations.length > 0

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    if (hasCustomizations) {
      onPress()
    } else {
      onQuickAdd()
    }
  }

  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.card, !item.isAvailable && styles.unavailable]}
        disabled={!item.isAvailable}
      >
        <View style={styles.content}>
          <View style={styles.info}>
            <VegBadge isVeg={item.isVeg} />
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
            {item.description && (
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <View style={styles.metaRow}>
              <Text style={styles.price}>{formatPrice(item.price)}</Text>
              {item.tags?.map((tag) => (
                <Badge key={tag} text={tag} variant="outline" style={styles.tag} />
              ))}
            </View>
          </View>

          <View style={styles.rightSection}>
            {item.imageUrl && (
              <Image source={{ uri: item.imageUrl }} style={styles.image} />
            )}
            {item.isAvailable && (
              <TouchableOpacity
                onPress={handleAdd}
                style={styles.addButton}
                activeOpacity={0.7}
              >
                <Text style={styles.addText}>
                  {cartQuantity > 0 ? `ADD (${cartQuantity})` : "ADD"}
                </Text>
                {hasCustomizations && (
                  <Text style={styles.customizeHint}>customisable</Text>
                )}
              </TouchableOpacity>
            )}
            {!item.isAvailable && (
              <Text style={styles.unavailableText}>Unavailable</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  unavailable: {
    opacity: 0.5,
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  info: {
    flex: 1,
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  name: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.black,
    marginTop: spacing.xs,
  },
  description: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[500],
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
    flexWrap: "wrap",
  },
  price: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  tag: {
    marginVertical: 0,
  },
  rightSection: {
    alignItems: "center",
    gap: spacing.sm,
  },
  image: {
    width: 100,
    height: 80,
    borderRadius: radii.lg,
    backgroundColor: colors.neutral[100],
  },
  addButton: {
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    alignItems: "center",
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  addText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.red,
  },
  customizeHint: {
    fontSize: 9,
    color: colors.neutral[400],
    marginTop: 1,
  },
  unavailableText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[400],
    fontWeight: typography.weights.medium,
  },
})
