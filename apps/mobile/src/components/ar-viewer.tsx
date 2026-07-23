import { View, Pressable } from "react-native"
import { WebView } from "react-native-webview"
import { MotiView } from "moti"
import { X } from "lucide-react-native"
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

export function ArViewer(props: {
  modelUrl: string
  usdzUrl?: string | null
  posterUrl: string | null
  itemName: string
  onClose: () => void
}) {
  const { modelUrl, posterUrl, itemName, onClose } = props
  const { colors } = useTheme()

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
      <Text variant="muted" className="absolute bottom-10 left-0 right-0 text-center text-xs px-8">
        Drag to rotate to preview in 3D
      </Text>
    </MotiView>
  )
}
