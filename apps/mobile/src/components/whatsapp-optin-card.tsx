import { View } from "react-native"
import { MotiView } from "moti"
import Svg, { Path } from "react-native-svg"
import { Text } from "@/components/ui/text"

const WHATSAPP_GREEN = "#25D366"

function WhatsAppGlyph({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="#FFFFFF">
      <Path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.463 3.488" />
    </Svg>
  )
}

export function WhatsAppOptInCard({
  delay = 0,
}: {
  optIn: { number: string; message: string }
  delay?: number
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 22, stiffness: 260, delay }}
      style={{
        borderColor: "rgba(37,211,102,0.32)",
        backgroundColor: "rgba(37,211,102,0.10)",
      }}
      className="relative overflow-hidden rounded-3xl border p-5"
    >
      <MotiView
        pointerEvents="none"
        from={{ scale: 1, opacity: 0.42 }}
        animate={{ scale: 1.4, opacity: 0.12 }}
        transition={{ loop: true, repeatReverse: true, type: "timing", duration: 1700 }}
        style={{
          position: "absolute",
          right: -36,
          top: -46,
          width: 138,
          height: 138,
          borderRadius: 999,
          backgroundColor: WHATSAPP_GREEN,
        }}
      />
      <MotiView
        pointerEvents="none"
        from={{ translateX: -150 }}
        animate={{ translateX: 440 }}
        transition={{
          loop: true,
          repeatReverse: false,
          type: "timing",
          duration: 2600,
          delay: 500,
        }}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 64,
          backgroundColor: "rgba(255,255,255,0.16)",
          transform: [{ skewX: "-16deg" }],
        }}
      />

      <View className="relative flex-row items-center gap-4">
        <MotiView
          from={{ rotate: "-6deg" }}
          animate={{ rotate: "6deg" }}
          transition={{ loop: true, repeatReverse: true, type: "timing", duration: 1500 }}
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            backgroundColor: WHATSAPP_GREEN,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: WHATSAPP_GREEN,
            shadowOpacity: 0.45,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          }}
        >
          <WhatsAppGlyph size={26} />
        </MotiView>

        <View className="flex-1">
          <Text variant="title" className="text-base">
            You'll get updates on WhatsApp
          </Text>
          <Text variant="muted" className="text-xs mt-0.5 leading-relaxed">
            We'll message you here as your order moves.
          </Text>
        </View>
      </View>
    </MotiView>
  )
}
