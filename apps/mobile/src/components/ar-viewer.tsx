import { useState } from "react"
import { View, Pressable } from "react-native"
import { WebView, type WebViewMessageEvent } from "react-native-webview"
import { MotiView, AnimatePresence } from "moti"
import { X, WifiOff } from "lucide-react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/theme/theme-provider"

function previewHtml(modelUrl: string, usdzUrl: string | null, posterUrl: string | null, bg: string) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>html,body{margin:0;height:100%;background:${bg}}model-viewer{width:100%;height:100%;--poster-color:${bg}}</style>
</head><body>
<script>
function post(payload) {
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(payload))
}
window.addEventListener("error", function (e) {
  if (e && e.target && e.target.tagName === "SCRIPT") post({ type: "error" })
}, true)
</script>
<script type="module" src="https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js"></script>
<model-viewer src="${modelUrl}" ${usdzUrl ? `ios-src="${usdzUrl}"` : ""} ${posterUrl ? `poster="${posterUrl}"` : ""} camera-controls auto-rotate shadow-intensity="1" exposure="1"></model-viewer>
<script>
var viewer = document.querySelector("model-viewer")
if (viewer) {
  viewer.addEventListener("error", function () { post({ type: "error" }) })
}
</script>
</body></html>`
}

export function ArViewer(props: {
  modelUrl: string
  usdzUrl?: string | null
  posterUrl: string | null
  itemName: string
  onClose: () => void
}) {
  const { modelUrl, usdzUrl, posterUrl, itemName, onClose } = props
  const { colors } = useTheme()
  const [loadError, setLoadError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const payload = JSON.parse(event.nativeEvent.data)
      if (payload?.type === "error") setLoadError(true)
    } catch {
      return
    }
  }

  function retry() {
    setLoadError(false)
    setRetryKey((k) => k + 1)
  }

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "timing", duration: 240 }}
      className="absolute inset-0 z-50 bg-canvas"
    >
      <View className="absolute top-14 left-5 right-5 z-10 flex-row items-center justify-between">
        <View>
          <Text variant="muted" className="text-xs uppercase tracking-widest mb-0.5">
            View in 3D
          </Text>
          <Text variant="label" className="text-ink text-base">
            {itemName}
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          className="w-11 h-11 rounded-full bg-surface border border-line items-center justify-center"
        >
          <X size={20} color={colors.ink} />
        </Pressable>
      </View>
      <WebView
        key={retryKey}
        source={{ html: previewHtml(modelUrl, usdzUrl ?? null, posterUrl, colors.canvas) }}
        style={{ flex: 1, backgroundColor: colors.canvas }}
        allowsInlineMediaPlayback
        originWhitelist={["*"]}
        onMessage={handleMessage}
        onError={() => setLoadError(true)}
      />
      <AnimatePresence>
        {loadError ? (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ backgroundColor: colors.canvas }}
            className="absolute inset-0 items-center justify-center px-10"
          >
            <WifiOff size={32} color={colors.muted} />
            <Text variant="title" className="text-lg mt-4 mb-1 text-center">
              Couldn't load the 3D preview
            </Text>
            <Text variant="muted" className="text-sm text-center mb-6">
              Check your connection and try again.
            </Text>
            <Button title="Try again" variant="outline" onPress={retry} />
          </MotiView>
        ) : null}
      </AnimatePresence>
      {!loadError ? (
        <Text variant="muted" className="absolute bottom-10 left-0 right-0 text-center text-xs px-8">
          Drag to rotate and explore every angle
        </Text>
      ) : null}
    </MotiView>
  )
}
