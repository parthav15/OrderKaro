import { memo, useEffect, useRef, useState } from "react"
import { View, ScrollView, Pressable, Image, useWindowDimensions } from "react-native"
import { useRouter } from "expo-router"
import { MotiView } from "moti"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import * as Haptics from "expo-haptics"
import { markIntroShown } from "@/lib/intro-session"
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

const WORDMARK = require("../assets/vision-menu-wordmark.png")
const ASPECT = 5.934
const WORDMARK_W = 226
const WORDMARK_H = WORDMARK_W / ASPECT
const BIG = 1.42
const BOUNDS = [0.13, 0.2113, 0.2908, 0.3909, 0.4867, 0.6133, 0.6989, 0.7981, 0.8948, 1]
const REVEAL = BOUNDS.map((b, i) => ({
  value: b * WORDMARK_W,
  delay: i === 0 ? 260 : 26,
  type: "timing" as const,
  duration: 64,
}))
const SHINE = [0, 0.45, 0]

const RevealMark = memo(function RevealMark() {
  return (
    <MotiView
      from={{ width: 0 }}
      animate={{ width: REVEAL }}
      style={{ position: "absolute", left: 0, top: 0, height: WORDMARK_H, overflow: "hidden" }}
    >
      <Image source={WORDMARK} style={{ width: WORDMARK_W, height: WORDMARK_H }} resizeMode="contain" />
    </MotiView>
  )
})

const ShimmerMark = memo(function ShimmerMark({ on }: { on: boolean }) {
  return (
    <MotiView
      pointerEvents="none"
      style={{ position: "absolute", left: 0, top: 0, width: WORDMARK_W, height: WORDMARK_H }}
      animate={{ opacity: on ? SHINE : 0 }}
      transition={{ opacity: { delay: 120, duration: 360, type: "timing" } }}
    >
      <Image
        source={WORDMARK}
        style={{ width: WORDMARK_W, height: WORDMARK_H }}
        resizeMode="contain"
        tintColor="#FFF1C6"
      />
    </MotiView>
  )
})

export default function Intro() {
  const router = useRouter()
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const { width, height } = useWindowDimensions()
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState(0)
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1240)
    const tH = setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 1240)
    const t2 = setTimeout(() => setPhase(2), 1660)
    return () => {
      clearTimeout(t1)
      clearTimeout(tH)
      clearTimeout(t2)
    }
  }, [])

  const last = index === SLIDES.length - 1
  const anchorTop = insets.top + 16
  const centerShift = height / 2 - anchorTop - WORDMARK_H / 2
  const shown = phase >= 2

  function finish() {
    markIntroShown()
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
        scrollEnabled={shown}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
      >
        {SLIDES.map((s, i) => {
          const active = i === index
          const revealed = i !== 0 || shown
          const Icon = s.Icon
          const step = (delay: number) => ({
            from: { opacity: 0, translateY: 24 },
            animate: { opacity: revealed ? 1 : 0, translateY: revealed ? 0 : 24 },
            transition: { delay, type: "timing" as const, duration: 500 },
          })
          return (
            <View key={s.key} style={{ width }} className="flex-1 justify-center px-8">
              <MotiView
                animate={{ opacity: active ? 1 : 0.25, scale: active ? 1 : 0.96 }}
                transition={{ type: "timing", duration: 400 }}
              >
                <MotiView {...step(0)}>
                  <View className="w-20 h-20 rounded-[26px] bg-surface border border-line items-center justify-center mb-9">
                    <Icon size={34} color={colors.accent} />
                  </View>
                </MotiView>
                <MotiView {...step(80)}>
                  <Text className="text-accent tracking-[4px] text-xs font-sans-bold mb-3">
                    {s.kicker}
                  </Text>
                </MotiView>
                <MotiView {...step(150)}>
                  <Text variant="display" className="text-[52px] leading-[1.03]">
                    {s.line1}
                  </Text>
                </MotiView>
                <MotiView {...step(210)}>
                  <Text variant="display" className="text-[52px] leading-[1.03] text-primary mb-5">
                    {s.line2}
                  </Text>
                </MotiView>
                <MotiView {...step(280)}>
                  <Text variant="muted" className="text-base leading-relaxed pr-6">
                    {s.body}
                  </Text>
                </MotiView>
              </MotiView>
            </View>
          )
        })}
      </ScrollView>

      <View
        pointerEvents="none"
        style={{ position: "absolute", left: 0, right: 0, top: anchorTop, alignItems: "center" }}
      >
        <MotiView
          from={{ translateY: centerShift, scale: BIG }}
          animate={{ translateY: phase >= 1 ? 0 : centerShift, scale: phase >= 1 ? 1 : BIG }}
          transition={{ type: "spring", damping: 18, stiffness: 90 }}
        >
          <View style={{ width: WORDMARK_W, height: WORDMARK_H }}>
            <RevealMark />
            <ShimmerMark on={phase >= 1} />
          </View>
        </MotiView>
      </View>

      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: shown ? 1 : 0 }}
        transition={{ delay: 180, duration: 400 }}
        pointerEvents={shown ? "auto" : "none"}
        style={{ position: "absolute", right: 24, top: insets.top + 22 }}
      >
        <Pressable onPress={finish} hitSlop={12}>
          <Text variant="label" className="text-sm text-muted">
            Skip
          </Text>
        </Pressable>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: shown ? 1 : 0, translateY: shown ? 0 : 16 }}
        transition={{ delay: 120, duration: 500 }}
        pointerEvents={shown ? "auto" : "none"}
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
      </MotiView>
    </View>
  )
}
