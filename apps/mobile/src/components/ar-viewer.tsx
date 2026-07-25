import { Platform, Alert, Linking } from "react-native"
import type { MenuItem } from "@/lib/types"

type ArItem = Pick<MenuItem, "model3dUrl" | "model3dUsdzUrl">

function sceneViewerUrl(glbUrl: string) {
  return `https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(glbUrl)}&mode=ar_only`
}

function arUrl(item: ArItem) {
  if (Platform.OS === "ios") return item.model3dUsdzUrl ?? null
  if (Platform.OS === "android" && item.model3dUrl) return sceneViewerUrl(item.model3dUrl)
  return null
}

export function arSupported(item: ArItem) {
  return arUrl(item) !== null
}

export function launchArOnTable(item: ArItem) {
  const url = arUrl(item)
  if (!url) {
    Alert.alert("AR unavailable", "AR isn't available for this dish yet.")
    return
  }
  Linking.openURL(url).catch(() => {
    Alert.alert("Couldn't open AR", "We couldn't launch AR on your device. Please try again.")
  })
}
