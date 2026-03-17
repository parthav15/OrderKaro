import { useState, useMemo, useCallback, useRef } from "react"
import { View, Text, Image, ScrollView, StyleSheet } from "react-native"
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet"
import { colors, typography, spacing, radii } from "@/constants/theme"
import { formatPrice } from "@/lib/utils"
import { useCartStore, CartItem } from "@/stores/cart"
import VegBadge from "@/components/ui/VegBadge"
import Button from "@/components/ui/Button"
import QuantityStepper from "./QuantityStepper"
import CustomizationGroup from "./CustomizationGroup"
import * as Haptics from "expo-haptics"

interface Option {
  id: string
  name: string
  priceAdjustment: number
  isDefault: boolean
  sortOrder: number
}

interface Customization {
  id: string
  name: string
  type: "SINGLE_SELECT" | "MULTI_SELECT"
  isRequired: boolean
  options: Option[]
}

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  isVeg: boolean
  customizations: Customization[]
}

interface ItemDetailSheetProps {
  item: MenuItem | null
  onClose: () => void
}

export default function ItemDetailSheet({ item, onClose }: ItemDetailSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null)
  const addItem = useCartStore((s) => s.addItem)
  const [quantity, setQuantity] = useState(1)
  const [selections, setSelections] = useState<Record<string, string[]>>({})

  const snapPoints = useMemo(() => ["75%", "90%"], [])

  const initializeDefaults = useCallback(() => {
    if (!item) return
    const defaults: Record<string, string[]> = {}
    item.customizations.forEach((c) => {
      const defaultOptions = c.options
        .filter((o) => o.isDefault)
        .map((o) => o.id)
      if (defaultOptions.length > 0) {
        defaults[c.id] = defaultOptions
      }
    })
    setSelections(defaults)
    setQuantity(1)
  }, [item])

  const handleToggle = (customizationId: string, optionId: string, type: string) => {
    setSelections((prev) => {
      const current = prev[customizationId] || []
      if (type === "SINGLE_SELECT") {
        return { ...prev, [customizationId]: [optionId] }
      }
      if (current.includes(optionId)) {
        return { ...prev, [customizationId]: current.filter((id) => id !== optionId) }
      }
      return { ...prev, [customizationId]: [...current, optionId] }
    })
  }

  const totalPrice = useMemo(() => {
    if (!item) return 0
    let optionsPrice = 0
    Object.entries(selections).forEach(([custId, optionIds]) => {
      const cust = item.customizations.find((c) => c.id === custId)
      if (cust) {
        optionIds.forEach((oid) => {
          const opt = cust.options.find((o) => o.id === oid)
          if (opt) optionsPrice += opt.priceAdjustment
        })
      }
    })
    return (item.price + optionsPrice) * quantity
  }, [item, selections, quantity])

  const canAdd = useMemo(() => {
    if (!item) return false
    return item.customizations
      .filter((c) => c.isRequired)
      .every((c) => (selections[c.id]?.length || 0) > 0)
  }, [item, selections])

  const handleAdd = () => {
    if (!item || !canAdd) return
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

    const selectedOptions = Object.entries(selections).map(([custId, optionIds]) => {
      const cust = item.customizations.find((c) => c.id === custId)!
      const opts = cust.options.filter((o) => optionIds.includes(o.id))
      return {
        customizationId: custId,
        customizationName: cust.name,
        optionIds,
        optionNames: opts.map((o) => o.name),
        priceAdjustment: opts.reduce((s, o) => s + o.priceAdjustment, 0),
      }
    })

    const cartItem: CartItem = {
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity,
      imageUrl: item.imageUrl,
      isVeg: item.isVeg,
      selectedOptions,
    }

    addItem(cartItem)
    onClose()
  }

  if (!item) return null

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onClose={onClose}
      enablePanDownToClose
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
      onChange={(index) => {
        if (index === 0) initializeDefaults()
      }}
    >
      <BottomSheetView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          {item.imageUrl && (
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
          )}

          <View style={styles.header}>
            <VegBadge isVeg={item.isVeg} size={20} />
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.price}>{formatPrice(item.price)}</Text>
            {item.description && (
              <Text style={styles.description}>{item.description}</Text>
            )}
          </View>

          {item.customizations.map((cust) => (
            <View key={cust.id} style={styles.customizationSection}>
              <CustomizationGroup
                name={cust.name}
                type={cust.type}
                isRequired={cust.isRequired}
                options={cust.options}
                selectedIds={selections[cust.id] || []}
                onToggle={(optionId) => handleToggle(cust.id, optionId, cust.type)}
              />
            </View>
          ))}

          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Quantity</Text>
            <QuantityStepper
              quantity={quantity}
              onIncrement={() => setQuantity((q) => q + 1)}
              onDecrement={() => setQuantity((q) => q - 1)}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={`Add to Cart \u00B7 ${formatPrice(totalPrice)}`}
            onPress={handleAdd}
            disabled={!canAdd}
            fullWidth
            size="lg"
          />
        </View>
      </BottomSheetView>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii["2xl"],
    borderTopRightRadius: radii["2xl"],
  },
  handle: {
    backgroundColor: colors.neutral[300],
    width: 40,
  },
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: radii.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.neutral[100],
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  name: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.black,
    marginTop: spacing.xs,
  },
  price: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  description: {
    fontSize: typography.sizes.base,
    color: colors.neutral[500],
    lineHeight: 20,
  },
  customizationSection: {
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  quantitySection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  quantityLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.black,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
})
