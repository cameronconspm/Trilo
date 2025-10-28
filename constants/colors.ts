import { useColorScheme, Appearance } from 'react-native';

// Color type definitions for better type safety
export interface ColorPalette {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  cardBackground: string;
  cardSecondary: string;
  innerCard: string;
  surface: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  inactive: string;
  success: string;
  warning: string;
  error: string;
  destructive: string;
  overlay: string;
  overlayLight: string;
  income: string;
  debt: string;
  subscription: string;
  bill: string;
  savings: string;
  oneTimeExpense: string;
  givenExpenses: string;
  uncategorized: string;
  shadowColor: string;
  shadowColorLight: string;
  shadowColorHeavy: string;
}

const LightColors: ColorPalette = {
  primary: '#007AFF',
  secondary: '#5856D6',
  background: '#F2F2F7', // iOS system background - light gray
  card: '#FFFFFF', // Pure white cards for light mode
  cardBackground: '#FFFFFF', // Alias for card
  cardSecondary: '#F5F6FA', // Subtle secondary card background
  innerCard: '#F8F9FA', // Inner card background for visual depth
  surface: '#FFFFFF', // Pure white surface
  text: '#000000',
  textSecondary: '#6C6C70',
  textTertiary: '#8E8E93', // Tertiary text color
  border: '#E5E5EA',
  inactive: '#3C3C43', // Dark gray for proper contrast on white background
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  destructive: '#FF3B30',

  // Semi-transparent overlays
  overlay: 'rgba(0, 0, 0, 0.05)',
  overlayLight: 'rgba(0, 0, 0, 0.02)',

  // Category colors - modern, vibrant, flat design
  income: '#27AE60', // Green - Income
  debt: '#E74C3C', // Red - Debt
  subscription: '#FFA94D', // Orange - Subscriptions
  bill: '#4E91F9', // Blue - Bills & Utilities
  savings: '#27AE60', // Green - Savings
  oneTimeExpense: '#5D6D7E', // Gray-blue - One-Time Expenses
  givenExpenses: '#5D6D7E', // Gray-blue - Given Expenses
  uncategorized: '#8E8E93', // Gray - Uncategorized

  // Shadow colors
  shadowColor: 'rgba(0, 0, 0, 0.12)',
  shadowColorLight: 'rgba(0, 0, 0, 0.08)',
  shadowColorHeavy: 'rgba(0, 0, 0, 0.16)',
};

const DarkColors: ColorPalette = {
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  background: '#000000', // True black background
  card: '#1C1C1E', // Dark gray cards
  cardBackground: '#1C1C1E', // Alias for card
  cardSecondary: '#2C2C2E', // Slightly lighter secondary cards
  innerCard: '#252527', // Inner card background for visual depth
  surface: '#1C1C1E', // Dark surface
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#6C6C70', // Tertiary text color for dark mode
  border: '#38383A',
  inactive: '#EBEBF5', // Light gray for proper contrast on dark background
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',
  destructive: '#FF453A',

  // Semi-transparent overlays
  overlay: 'rgba(255, 255, 255, 0.05)',
  overlayLight: 'rgba(255, 255, 255, 0.02)',

  // Category colors - adjusted for dark mode
  income: '#30D158', // Brighter green for dark mode
  debt: '#FF453A', // Brighter red for dark mode
  subscription: '#FF9F0A', // Brighter orange for dark mode
  bill: '#64D2FF', // Brighter blue for dark mode
  savings: '#27AE60', // Green for dark mode
  oneTimeExpense: '#5D6D7E', // Gray for dark mode
  givenExpenses: '#5D6D7E', // Gray - Given Expenses
  uncategorized: '#8E8E93', // Gray - Uncategorized

  // Shadow colors
  shadowColor: 'rgba(0, 0, 0, 0.3)',
  shadowColorLight: 'rgba(0, 0, 0, 0.2)',
  shadowColorHeavy: 'rgba(0, 0, 0, 0.4)',
};

// Theme type for better type safety
export type Theme = 'system' | 'light' | 'dark';

// Hook to get colors based on theme
export function useThemeColors(themePreference: Theme): ColorPalette {
  const systemColorScheme = useColorScheme();

  const effectiveTheme =
    themePreference === 'system'
      ? systemColorScheme || Appearance.getColorScheme() || 'light'
      : themePreference;

  return effectiveTheme === 'dark' ? DarkColors : LightColors;
}

// Utility function to get colors without hook (for non-component usage)
export const getThemeColors = (theme: Theme): ColorPalette => {
  const effectiveTheme = theme === 'system' 
    ? Appearance.getColorScheme() || 'light'
    : theme;
  return effectiveTheme === 'dark' ? DarkColors : LightColors;
};

// Default export for backward compatibility (light theme)
const Colors = LightColors;
export default Colors;
