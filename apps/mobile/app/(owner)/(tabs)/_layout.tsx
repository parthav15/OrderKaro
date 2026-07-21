import { Tabs } from "expo-router"
import { ShoppingBag, UtensilsCrossed, BarChart3, LayoutGrid } from "lucide-react-native"
import { useTheme } from "@/theme/theme-provider"

export default function OwnerTabsLayout() {
  const { colors } = useTheme()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          height: 88,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 11,
          marginTop: 2,
        },
        sceneStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: "Menu",
          tabBarIcon: ({ color, size }) => <UtensilsCrossed color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size - 2} />,
        }}
      />
    </Tabs>
  )
}
