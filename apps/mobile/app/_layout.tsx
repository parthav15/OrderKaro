import "../global.css"
import { useEffect, useState } from "react"
import { View, StyleSheet } from "react-native"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { QueryClientProvider } from "@tanstack/react-query"
import * as SplashScreen from "expo-splash-screen"
import { useFonts } from "expo-font"
import { useVideoPlayer, VideoView } from "expo-video"
import {
  PlayfairDisplay_700Bold,
  PlayfairDisplay_600SemiBold_Italic,
} from "@expo-google-fonts/playfair-display"
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter"
import { ThemeProvider } from "@/theme/theme-provider"
import { queryClient } from "@/lib/query"

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    PlayfairDisplay_600SemiBold_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  })
  const [splashDone, setSplashDone] = useState(false)

  const player = useVideoPlayer(require("../assets/splash-anim.mp4"), (p) => {
    p.loop = false
    p.muted = true
    p.play()
  })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded])

  useEffect(() => {
    const sub = player.addListener("playToEnd", () => {
      player.pause()
      setSplashDone(true)
    })
    const timer = setTimeout(() => setSplashDone(true), 3600)
    return () => {
      sub.remove()
      clearTimeout(timer)
    }
  }, [player])

  if (!fontsLoaded) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                gestureEnabled: false,
                contentStyle: { backgroundColor: "#141110" },
                animation: "fade",
              }}
            />
            {!splashDone ? (
              <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#141110" }]} />
                <VideoView
                  player={player}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                  nativeControls={false}
                />
              </View>
            ) : null}
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
