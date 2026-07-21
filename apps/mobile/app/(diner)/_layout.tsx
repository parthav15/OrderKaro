import { Stack } from "expo-router"

export default function DinerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#141110" },
      }}
    />
  )
}
