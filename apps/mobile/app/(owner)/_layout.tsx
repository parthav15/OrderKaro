import { Stack } from "expo-router"

export default function OwnerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#141110" },
      }}
    />
  )
}
