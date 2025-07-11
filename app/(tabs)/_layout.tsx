import React from "react";
import { Tabs } from "expo-router";
import { Home, BarChart3, LineChart, User } from "lucide-react-native";
import { Platform } from "react-native";
import { useThemeColors } from "@/constants/colors";
import { useSettings } from "@/context/SettingsContext";
import { Spacing, Shadow } from "@/constants/spacing";

export default function TabLayout() {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          height: 90,
          paddingBottom: 30,
          paddingTop: 10,
          paddingHorizontal: 16,
          ...Shadow.nav,
        },
        tabBarItemStyle: {
          paddingVertical: Spacing.sm,
          minHeight: Spacing.minTouchTarget,
          paddingHorizontal: 12, // Added to create spacing between icons and screen edge
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Overview",
          tabBarIcon: ({ color, focused }) => (
            <Home 
              size={focused ? 26 : 24} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: "Budget",
          tabBarIcon: ({ color, focused }) => (
            <BarChart3 
              size={focused ? 26 : 24} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color, focused }) => (
            <LineChart 
              size={focused ? 26 : 24} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <User 
              size={focused ? 26 : 24} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
    </Tabs>
  );
}
