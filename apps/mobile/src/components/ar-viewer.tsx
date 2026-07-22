import { View, Pressable, Linking, Platform } from "react-native"
import { WebView } from "react-native-webview"
import { MotiView } from "moti"
import { X, Box } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { useTheme } from "@/theme/theme-provider"

function previewHtml(modelUrl: string, posterUrl: string | null, bg: string) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<script type="module" src="https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js"></script>
<style>html,body{margin:0;height:100%;background:${bg}}model-viewer{width:100%;height:100%;--poster-color:${bg}}</style>
</head><body>
<model-viewer src="${modelUrl}" ${posterUrl ? `poster="${posterUrl}"` : ""} camera-controls auto-rotate shadow-intensity="1" exposure="1"></model-viewer>
</body></html>`
}

function launchAr(glbUrl: string, usdzUrl: string | null | undefined, title: string) {
  if (Platform.OS === "android") {
    const query = `file=${encodeURIComponent(glbUrl)}&mode=ar_preferred&title=${encodeURIComponent(title)}&resizable=false`
    const intent = `intent://arvr.google.com/scene-viewer/1.0?${query}#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(glbUrl)};end;`
    Linking.openURL(intent).catch(() => {})
    return
  }
  if (usdzUrl) Linking.openURL(usdzUrl).catch(() => {})
}

export function ArViewer({
  modelUrl,
  usdzUrl,
  posterUrl,
  itemName,
  onClose,
}: {
  modelUrl: string
  usdzUrl?: string | null
  posterUrl: string | null
  itemName: string
  onClose: () => void
}) {
  const { colors } = useTheme()
  const canLaunchAr = Platform.OS === "android" || !!usdzUrl

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "timing", duration: 240 }}
      className="absolute inset-0 z-50 bg-canvas"
    >
      <View className="absolute top-14 left-5 right-5 z-10 flex-row items-center justify-between">
        <Text variant="label" className="text-ink text-base">
          {itemName}
        </Text>
        <Pressable
          onPress={onClose}
          className="w-11 h-11 rounded-full bg-surface border border-line items-center justify-center"
        >
          <X size={20} color={colors.ink} />
        </Pressable>
      </View>
      <WebView
        source={{ html: previewHtml(modelUrl, posterUrl, colors.canvas) }}
        style={{ flex: 1, backgroundColor: colors.canvas }}
        allowsInlineMediaPlayback
        originWhitelist={["*"]}
      />
      {canLaunchAr ? (
        <View className="absolute bottom-10 left-0 right-0 items-center">
          <Pressable
            onPress={() => launchAr(modelUrl, usdzUrl, itemName)}
            className="flex-row items-center gap-2 rounded-full bg-primary px-6 py-3.5"
          >
            <Box size={18} color={colors.onPrimary} />
            <Text className="font-sans-bold text-base" style={{ color: colors.onPrimary }}>
              View in your space
            </Text>
          </Pressable>
        </View>
      ) : (
        <Text variant="muted" className="absolute bottom-8 left-0 right-0 text-center text-xs px-8">
          Drag to rotate to preview in 3D.
        </Text>
      )}
    </MotiView>
  )
}
