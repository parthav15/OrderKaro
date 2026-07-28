import { useMemo, useState } from "react"
import { Modal, View, Pressable, TextInput, ScrollView } from "react-native"
import { MotiView } from "moti"
import { SafeAreaView } from "react-native-safe-area-context"
import { Search, Check, ChevronDown, X, CreditCard, Coins } from "lucide-react-native"
import { SUPPORTED_COUNTRIES, countryByCode } from "@orderkaro/shared"
import { Text } from "@/components/ui/text"
import { useTheme } from "@/theme/theme-provider"

export function CountryPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (code: string) => void
}) {
  const { colors } = useTheme()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const selected = countryByCode(value) ?? SUPPORTED_COUNTRIES[0]
  const gateway = selected.code === "IN" ? "Cashfree" : "Stripe"

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return SUPPORTED_COUNTRIES
    return SUPPORTED_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.currency.toLowerCase().includes(q) ||
        c.dialCode.includes(q)
    )
  }, [query])

  function pick(code: string) {
    onChange(code)
    setOpen(false)
    setQuery("")
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
        className="flex-row items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3"
      >
        <Text className="text-2xl">{selected.flag}</Text>
        <View className="flex-1">
          <Text variant="title" className="text-sm">
            {selected.name}
          </Text>
          <View className="mt-0.5 flex-row items-center gap-2">
            <CreditCard size={12} color={colors.accent} />
            <Text variant="muted" className="text-[11px]">
              {gateway}
            </Text>
            <Text variant="muted" className="text-[11px]">
              ·
            </Text>
            <Coins size={12} color={colors.accent} />
            <Text variant="muted" className="text-[11px]">
              {selected.currency}
            </Text>
          </View>
        </View>
        <ChevronDown size={18} color={colors.muted} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}>
          <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)} />
          <MotiView
            from={{ translateY: 40, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 22, stiffness: 240 }}
            className="rounded-t-3xl bg-canvas"
            style={{ maxHeight: "82%" }}
          >
            <SafeAreaView edges={["bottom"]}>
              <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
                <Text variant="heading" className="text-xl">
                  Select country
                </Text>
                <Pressable
                  onPress={() => setOpen(false)}
                  className="h-9 w-9 items-center justify-center rounded-full bg-surface border border-line"
                >
                  <X size={18} color={colors.ink} />
                </Pressable>
              </View>

              <View className="px-5 pb-2">
                <View className="flex-row items-center gap-2 rounded-2xl border border-line bg-surface px-4">
                  <Search size={18} color={colors.muted} />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search country or currency"
                    placeholderTextColor={colors.muted}
                    autoCorrect={false}
                    className="h-12 flex-1 text-ink font-sans-medium text-base"
                  />
                </View>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                {filtered.length === 0 ? (
                  <Text variant="muted" className="py-10 text-center text-sm">
                    No match
                  </Text>
                ) : (
                  filtered.map((c) => {
                    const active = c.code === selected.code
                    return (
                      <Pressable
                        key={c.code}
                        onPress={() => pick(c.code)}
                        style={active ? { backgroundColor: `${colors.primary}14` } : undefined}
                        className="flex-row items-center gap-3 rounded-2xl px-3 py-3"
                      >
                        <Text className="text-xl">{c.flag}</Text>
                        <View className="flex-1">
                          <Text variant="title" className="text-sm">
                            {c.name}
                          </Text>
                          <Text variant="muted" className="text-[11px]">
                            {c.dialCode} · {c.currency}
                          </Text>
                        </View>
                        <View className="rounded-full bg-surface border border-line px-2 py-0.5">
                          <Text variant="muted" className="text-[10px] font-sans-bold uppercase">
                            {c.code === "IN" ? "Cashfree" : "Stripe"}
                          </Text>
                        </View>
                        {active ? <Check size={18} color={colors.primary} strokeWidth={3} /> : null}
                      </Pressable>
                    )
                  })
                )}
              </ScrollView>
            </SafeAreaView>
          </MotiView>
        </View>
      </Modal>
    </>
  )
}
