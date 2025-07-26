import React from "react";
import { Tabs } from "expo-router";
import { Home, BarChart3, LineChart, User } from "lucide-react-native";
import { useThemeColors } from "@/constants/colors";
import { useSettings } from "@/context/SettingsContext";
import { Shadow } from "@/constants/spacing";

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
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 88,
          paddingBottom: 34,
          paddingTop: 8,
          paddingHorizontal: 16,
          elevation: 0,
          ...Shadow.nav,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
          minHeight: 60,
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
          textAlign: 'center',
        },
        tabBarShowLabel: true,
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
