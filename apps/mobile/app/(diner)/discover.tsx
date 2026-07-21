import { useState } from "react"
import { View, TextInput, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { MotiView } from "moti"
import { ArrowLeft, ArrowRight, UtensilsCrossed, ScanLine, Receipt, User } from "lucide-react-native"
import { Screen } from "@/components/ui/screen"
import { Text } from "@/components/ui/text"
import { DismissKeyboard } from "@/components/ui/dismiss-keyboard"
import { useTheme } from "@/theme/theme-provider"

const FEATURED = { slug: "sn-college-canteen", name: "SN College Canteen" }

export default function Discover() {
  const router = useRouter()
  const { colors } = useTheme()
  const [handle, setHandle] = useState("")

  function open(slug: string) {
    const clean = slug.trim().toLowerCase()
    if (clean) router.push({ pathname: "/(diner)/r/[slug]/menu", params: { slug: clean } })
  }

  return (
    <Screen>
      <DismissKeyboard>
        <View className="flex-1 pt-4">
          <View className="flex-row justify-between items-center mb-4">
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
              className="w-11 h-11 rounded-full bg-surface border border-line items-center justify-center"
            >
              <ArrowLeft size={20} color={colors.ink} />
            </Pressable>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => router.push("/(diner)/orders")}
                className="w-11 h-11 rounded-full bg-surface border border-line items-center justify-center"
              >
                <Receipt size={20} color={colors.ink} />
              </Pressable>
              <Pressable
                onPress={() => router.push("/(diner)/profile")}
                className="w-11 h-11 rounded-full bg-surface border border-line items-center justify-center"
              >
                <User size={20} color={colors.ink} />
              </Pressable>
            </View>
          </View>
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600 }}
          >
            <Text className="text-accent tracking-[4px] text-xs font-sans-semibold mb-3">
              DISCOVER
            </Text>
            <Text variant="display" className="text-4xl leading-tight mb-8">
              Where are we eating?
            </Text>

            <Pressable onPress={() => router.push("/(diner)/scan")}>
              <View className="flex-row items-center bg-primary rounded-2xl px-5 py-4 mb-4">
                <ScanLine size={22} color="#FFF7F3" />
                <Text className="text-[#FFF7F3] font-sans-bold text-base ml-3 flex-1">
                  Scan a table QR
                </Text>
                <ArrowRight size={20} color="#FFF7F3" />
              </View>
            </Pressable>

            <View className="flex-row items-center mb-4">
              <View className="flex-1 h-px bg-line" />
              <Text variant="muted" className="text-[11px] tracking-widest uppercase mx-3">
                or enter a handle
              </Text>
              <View className="flex-1 h-px bg-line" />
            </View>

            <View className="flex-row items-center bg-surface rounded-2xl border border-line px-5">
              <TextInput
                value={handle}
                onChangeText={setHandle}
                placeholder="restaurant handle"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                onSubmitEditing={() => open(handle)}
                className="flex-1 h-14 text-ink font-sans-medium text-base"
              />
              <Pressable onPress={() => open(handle)} className="w-10 h-10 items-center justify-center">
                <ArrowRight size={20} color={colors.primary} />
              </Pressable>
            </View>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 18 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 180, delay: 200 }}
            className="mt-8"
          >
            <Text variant="muted" className="text-xs uppercase tracking-widest mb-3">
              Featured
            </Text>
            <Pressable onPress={() => open(FEATURED.slug)}>
              <View className="flex-row items-center bg-surface rounded-3xl border border-line p-5">
                <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center mr-4">
                  <UtensilsCrossed size={22} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text variant="title" className="text-lg">
                    {FEATURED.name}
                  </Text>
                  <Text variant="muted" className="text-sm mt-0.5">
                    vision-menu.app/{FEATURED.slug}
                  </Text>
                </View>
                <ArrowRight size={20} color={colors.muted} />
              </View>
            </Pressable>
          </MotiView>
        </View>
      </DismissKeyboard>
    </Screen>
  )
}
