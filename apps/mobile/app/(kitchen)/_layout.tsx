import { Stack } from "expo-router"

export default function KitchenLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#141110" },
      }}
    />
  )
}
