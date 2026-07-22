import { useRef, useState } from "react"
import { View, ScrollView, Pressable, useWindowDimensions } from "react-native"
import { useRouter } from "expo-router"
import { MotiView } from "moti"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import * as SecureStore from "expo-secure-store"
import { Sparkles, ScanLine, UtensilsCrossed, ArrowRight } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/theme/theme-provider"

const SLIDES = [
  {
    key: "welcome",
    kicker: "WELCOME",
    line1: "Dining,",
    line2: "elevated.",
    body: "A beautifully simple way to discover, order and pay — right from your table.",
    Icon: Sparkles,
  },
  {
    key: "discover",
    kicker: "DISCOVER",
    line1: "Scan.",
    line2: "See it in 3D.",
    body: "Scan the table code, explore the menu, and preview signature dishes in stunning AR.",
    Icon: ScanLine,
  },
  {
    key: "order",
    kicker: "SEAMLESS",
    line1: "Order &",
    line2: "pay in taps.",
    body: "Build your order, pay your way, and track it live all the way to the counter.",
    Icon: UtensilsCrossed,
  },
]

export default function Intro() {
  const router = useRouter()
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const [index, setIndex] = useState(0)
  const scrollRef = useRef<ScrollView>(null)

  const last = index === SLIDES.length - 1

  async function finish() {
    await SecureStore.setItemAsync("vm-intro-seen", "1")
    router.replace("/")
  }

  function next() {
    if (last) finish()
    else scrollRef.current?.scrollTo({ x: width * (index + 1), animated: true })
  }

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
      >
        {SLIDES.map((s, i) => {
          const active = i === index
          const Icon = s.Icon
          return (
            <View key={s.key} style={{ width }} className="flex-1 justify-center px-8">
              <MotiView
                animate={{ opacity: active ? 1 : 0.25, scale: active ? 1 : 0.96 }}
                transition={{ type: "timing", duration: 450 }}
              >
                <View className="w-20 h-20 rounded-[26px] bg-surface border border-line items-center justify-center mb-9">
                  <MotiView
                    from={{ opacity: 0.4, scale: 0.9 }}
                    animate={{ opacity: active ? 1 : 0.4, scale: active ? 1 : 0.9 }}
                    transition={{ type: "spring", damping: 14, stiffness: 160 }}
                  >
                    <Icon size={34} color={colors.accent} />
                  </MotiView>
                </View>
                <Text className="text-accent tracking-[4px] text-xs font-sans-bold mb-3">
                  {s.kicker}
                </Text>
                <Text variant="display" className="text-[52px] leading-[1.03]">
                  {s.line1}
                </Text>
                <Text variant="display" className="text-[52px] leading-[1.03] text-primary mb-5">
                  {s.line2}
                </Text>
                <Text variant="muted" className="text-base leading-relaxed pr-6">
                  {s.body}
                </Text>
              </MotiView>
            </View>
          )
        })}
      </ScrollView>

      <View
        pointerEvents="none"
        style={{ position: "absolute", left: 24, top: insets.top + 14 }}
      >
        <Text variant="heading" style={{ fontSize: 48, lineHeight: 52, color: "#D9B24A" }}>
          VM
        </Text>
      </View>

      <Pressable
        onPress={finish}
        hitSlop={12}
        style={{ position: "absolute", right: 24, top: insets.top + 22 }}
      >
        <Text variant="label" className="text-sm text-muted">
          Skip
        </Text>
      </Pressable>

      <View
        style={{ position: "absolute", left: 0, right: 0, bottom: insets.bottom + 22 }}
        className="px-8 flex-row items-center justify-between"
      >
        <View className="flex-row items-center gap-2">
          {SLIDES.map((s, i) => (
            <MotiView
              key={s.key}
              animate={{ width: i === index ? 26 : 8, opacity: i === index ? 1 : 0.4 }}
              transition={{ type: "timing", duration: 300 }}
              className="h-2 rounded-full bg-primary"
            />
          ))}
        </View>

        {last ? (
          <View style={{ width: 172 }}>
            <Button title="Get started" onPress={finish} />
          </View>
        ) : (
          <Pressable
            onPress={next}
            className="w-14 h-14 rounded-full bg-primary items-center justify-center"
          >
            <ArrowRight size={22} color="#FFF7F3" />
          </Pressable>
        )}
      </View>
    </View>
  )
}
