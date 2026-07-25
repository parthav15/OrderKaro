import { useMemo, useState } from "react"
import { View, Modal, Pressable, ScrollView } from "react-native"
import { MotiView, AnimatePresence } from "moti"
import { Easing } from "react-native-reanimated"
import { X, Minus, Plus, Check, Box } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/theme/theme-provider"
import { useCart, type SelectedOption } from "@/stores/cart"
import type { MenuItem } from "@/lib/types"

export function ItemDetailSheet({
  item,
  brand,
  onClose,
  onViewAr,
}: {
  item: MenuItem | null
  brand: string
  onClose: () => void
  onViewAr: (item: MenuItem) => void
}) {
  const { colors } = useTheme()
  const addLine = useCart((s) => s.addLine)
  const [quantity, setQuantity] = useState(1)
  const [selections, setSelections] = useState<Record<string, string[]>>({})

  const key = item?.id ?? ""
  useMemo(() => {
    if (item) {
      const defaults: Record<string, string[]> = {}
      item.customizations.forEach((c) => {
        const def = c.options.filter((o) => o.isDefault).map((o) => o.id)
        if (def.length) defaults[c.id] = def
      })
      setSelections(defaults)
      setQuantity(1)
    }
  }, [key])

  const unitPrice = useMemo(() => {
    if (!item) return 0
    let price = Number(item.price)
    item.customizations.forEach((c) => {
      ;(selections[c.id] ?? []).forEach((optId) => {
        const opt = c.options.find((o) => o.id === optId)
        if (opt) price += Number(opt.priceAdjustment)
      })
    })
    return price
  }, [item, selections])

  const missingRequired = useMemo(() => {
    if (!item) return false
    return item.customizations.some(
      (c) => c.isRequired && (selections[c.id] ?? []).length === 0
    )
  }, [item, selections])

  function toggle(c: MenuItem["customizations"][number], optId: string) {
    setSelections((prev) => {
      const current = prev[c.id] ?? []
      if (c.type === "SINGLE_SELECT") return { ...prev, [c.id]: [optId] }
      const has = current.includes(optId)
      return { ...prev, [c.id]: has ? current.filter((x) => x !== optId) : [...current, optId] }
    })
  }

  function add() {
    if (!item || missingRequired) return
    const selectedOptions: SelectedOption[] = item.customizations
      .filter((c) => (selections[c.id] ?? []).length > 0)
      .map((c) => {
        const optIds = selections[c.id]
        const opts = c.options.filter((o) => optIds.includes(o.id))
        return {
          customizationId: c.id,
          customizationName: c.name,
          optionIds: optIds,
          optionNames: opts.map((o) => o.name),
          priceAdjustment: opts.reduce((s, o) => s + Number(o.priceAdjustment), 0),
        }
      })
    addLine({
      menuItemId: item.id,
      name: item.name,
      basePrice: Number(item.price),
      quantity,
      imageUrl: item.imageUrl,
      isVeg: item.isVeg,
      availableForDelivery: item.availableForDelivery,
      selectedOptions,
    })
    onClose()
  }

  return (
    <Modal visible={!!item} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-end">
        <Pressable className="flex-1" onPress={onClose} />
        <AnimatePresence>
          {item && (
            <MotiView
              from={{ translateY: 40, opacity: 0 }}
              animate={{ translateY: 0, opacity: 1 }}
              exit={{ translateY: 40, opacity: 0 }}
              transition={{ type: "timing", duration: 240, easing: Easing.out(Easing.cubic) }}
              className="bg-surface-elevated rounded-t-[32px] max-h-[85%]"
            >
              <View className="items-center pt-4">
                <View className="w-10 h-1.5 rounded-full bg-line" />
              </View>

              <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 12 }}>
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1 pr-3">
                    <Text variant="heading" className="text-2xl">
                      {item.name}
                    </Text>
                  </View>
                  <Pressable
                    onPress={onClose}
                    className="w-9 h-9 rounded-full bg-surface items-center justify-center"
                  >
                    <X size={18} color={colors.muted} />
                  </Pressable>
                </View>

                {item.description ? (
                  <Text variant="muted" className="text-base leading-relaxed mb-4">
                    {item.description}
                  </Text>
                ) : null}

                {item.model3dUrl ? (
                  <Pressable
                    onPress={() => onViewAr(item)}
                    className="flex-row items-center gap-2 self-start rounded-full border border-accent/40 px-4 py-2 mb-6"
                  >
                    <Box size={16} color={colors.accent} />
                    <Text className="text-accent font-sans-semibold text-sm">View in 3D</Text>
                  </Pressable>
                ) : null}

                {item.customizations.map((c) => (
                  <View key={c.id} className="mb-6">
                    <View className="flex-row items-center justify-between mb-3">
                      <Text variant="label" className="text-base">
                        {c.name}
                      </Text>
                      {c.isRequired ? (
                        <Text variant="muted" className="text-xs uppercase tracking-wide">
                          Required
                        </Text>
                      ) : null}
                    </View>
                    <View className="gap-2">
                      {c.options.map((opt) => {
                        const active = (selections[c.id] ?? []).includes(opt.id)
                        return (
                          <Pressable
                            key={opt.id}
                            onPress={() => toggle(c, opt.id)}
                            className={`flex-row items-center justify-between rounded-2xl border px-4 py-3.5 ${
                              active ? "border-primary bg-primary/10" : "border-line bg-surface"
                            }`}
                          >
                            <Text variant="body" className="text-base">
                              {opt.name}
                            </Text>
                            <View className="flex-row items-center gap-3">
                              {Number(opt.priceAdjustment) > 0 ? (
                                <Text variant="muted" className="text-sm">
                                  +₹{Number(opt.priceAdjustment)}
                                </Text>
                              ) : null}
                              {active ? <Check size={18} color={brand} /> : null}
                            </View>
                          </Pressable>
                        )
                      })}
                    </View>
                  </View>
                ))}
              </ScrollView>

              <View className="flex-row items-center gap-4 px-6 pb-10 pt-2 border-t border-line">
                <View className="flex-row items-center bg-surface rounded-full border border-line">
                  <Pressable
                    onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-11 h-11 items-center justify-center"
                  >
                    <Minus size={18} color={colors.ink} />
                  </Pressable>
                  <Text variant="label" className="text-base w-6 text-center">
                    {quantity}
                  </Text>
                  <Pressable
                    onPress={() => setQuantity((q) => q + 1)}
                    className="w-11 h-11 items-center justify-center"
                  >
                    <Plus size={18} color={colors.ink} />
                  </Pressable>
                </View>
                <View className="flex-1">
                  <Button
                    title={missingRequired ? "Choose options" : `Add · ₹${unitPrice * quantity}`}
                    disabled={missingRequired}
                    onPress={add}
                  />
                </View>
              </View>
            </MotiView>
          )}
        </AnimatePresence>
      </View>
    </Modal>
  )
}
