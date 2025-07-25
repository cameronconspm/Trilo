import { useColorScheme, Appearance } from 'react-native';

const LightColors = {
  primary: "#007AFF",
  secondary: "#5856D6",
  background: "#F2F2F7", // iOS system background - light gray
  card: "#FFFFFF", // Pure white cards for light mode
  cardSecondary: "#F5F6FA", // Subtle secondary card background
  surface: "#FFFFFF", // Pure white surface
  text: "#000000",
  textSecondary: "#6C6C70",
  border: "#E5E5EA",
  inactive: "#8E8E93",
  success: "#34C759",
  warning: "#FF9500",
  error: "#FF3B30",
  destructive: "#FF3B30",
  
  // Semi-transparent overlays
  overlay: "rgba(0, 0, 0, 0.05)",
  overlayLight: "rgba(0, 0, 0, 0.02)",
  
  // Category colors - modern, vibrant, flat design
  income: "#27AE60",           // Green - Income
  debt: "#E74C3C",             // Red - Debt  
  subscription: "#FFA94D",     // Orange - Subscriptions
  bill: "#4E91F9",             // Blue - Bills & Utilities

  oneTimeExpense: "#5D6D7E",   // Gray-blue - One-Time Expenses
  givenExpenses: "#5D6D7E",    // Gray-blue - Given Expenses
  savings: "#27AE60",           // Green - Savings
  
  // Calendar-specific accessible colors (WCAG AA compliant)
  calendarExpense: "#B91C1C",  // Darker red for better contrast
  calendarPayday: "#047857",   // Darker green for better contrast
  calendarRecurring: "#6D28D9", // Darker purple for better contrast
  
  // Shadow colors
  shadowColor: "rgba(0, 0, 0, 0.12)",
  shadowColorLight: "rgba(0, 0, 0, 0.08)",
  shadowColorHeavy: "rgba(0, 0, 0, 0.16)",
};

const DarkColors = {
  primary: "#0A84FF",
  secondary: "#5E5CE6",
  background: "#000000", // True black background
  card: "#1C1C1E", // Dark gray cards
  cardSecondary: "#2C2C2E", // Slightly lighter secondary cards
  surface: "#1C1C1E", // Dark surface
  text: "#FFFFFF",
  textSecondary: "#8E8E93",
  border: "#38383A",
  inactive: "#636366",
  success: "#30D158",
  warning: "#FF9F0A",
  error: "#FF453A",
  destructive: "#FF453A",
  
  // Semi-transparent overlays
  overlay: "rgba(255, 255, 255, 0.05)",
  overlayLight: "rgba(255, 255, 255, 0.02)",
  
  // Category colors - adjusted for dark mode
  income: "#30D158",           // Brighter green for dark mode
  debt: "#FF453A",             // Brighter red for dark mode
  subscription: "#FF9F0A",     // Brighter orange for dark mode
  bill: "#64D2FF",             // Brighter blue for dark mode

  oneTimeExpense: "#5D6D7E",   // Gray for dark mode
  givenExpenses: "#5D6D7E",    // Gray - Given Expenses
  savings: "#27AE60",           // Green - Savings
  
  // Calendar-specific accessible colors for dark mode
  calendarExpense: "#EF4444",  // Brighter red for dark mode contrast
  calendarPayday: "#10B981",   // Brighter green for dark mode contrast
  calendarRecurring: "#8B5CF6", // Brighter purple for dark mode
  
  // Shadow colors
  shadowColor: "rgba(0, 0, 0, 0.3)",
  shadowColorLight: "rgba(0, 0, 0, 0.2)",
  shadowColorHeavy: "rgba(0, 0, 0, 0.4)",
};

// Hook to get colors based on theme
export function useThemeColors(themePreference: 'system' | 'light' | 'dark') {
  const systemColorScheme = useColorScheme();
  
  const effectiveTheme = themePreference === 'system' 
    ? (systemColorScheme || Appearance.getColorScheme() || 'light')
    : themePreference;
    
  return effectiveTheme === 'dark' ? DarkColors : LightColors;
}

// Default export for backward compatibility (light theme)
const Colors = LightColors;
export default Colors;