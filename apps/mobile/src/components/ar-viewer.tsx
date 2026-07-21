import { View, Pressable } from "react-native"
import { WebView } from "react-native-webview"
import { MotiView } from "moti"
import { X } from "lucide-react-native"
import { Text } from "@/components/ui/text"

function html(modelUrl: string, posterUrl: string | null) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<script type="module" src="https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js"></script>
<style>html,body{margin:0;height:100%;background:#141110}model-viewer{width:100%;height:100%;--poster-color:#141110}
button{position:absolute;bottom:24px;left:50%;transform:translateX(-50%);background:#BE2540;color:#FFF7F3;border:none;padding:14px 22px;border-radius:999px;font-family:-apple-system,sans-serif;font-weight:600;font-size:15px}</style>
</head><body>
<model-viewer src="${modelUrl}" ${posterUrl ? `poster="${posterUrl}"` : ""} camera-controls auto-rotate ar ar-modes="scene-viewer webxr quick-look" shadow-intensity="1" exposure="1">
<button slot="ar-button">View in your space</button>
</model-viewer>
</body></html>`
}

export function ArViewer({
  modelUrl,
  posterUrl,
  itemName,
  onClose,
}: {
  modelUrl: string
  posterUrl: string | null
  itemName: string
  onClose: () => void
}) {
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
          <X size={20} color="#F6EFE7" />
        </Pressable>
      </View>
      <WebView
        source={{ html: html(modelUrl, posterUrl) }}
        style={{ flex: 1, backgroundColor: "#141110" }}
        allowsInlineMediaPlayback
        originWhitelist={["*"]}
      />
      <Text variant="muted" className="absolute bottom-8 left-0 right-0 text-center text-xs px-8">
        Drag to rotate. Tap "View in your space" for AR on a supported phone.
      </Text>
    </MotiView>
  )
}
