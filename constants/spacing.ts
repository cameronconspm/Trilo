import { Platform } from 'react-native';

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  
  // Global UI Standards - Universal padding & spacing
  screenHorizontal: 16, // Universal 16px horizontal screen padding
  screenTop: Platform.OS === 'ios' ? 60 : 48,
  screenBottom: Platform.OS === 'ios' ? 120 : 100,
  
  // Card standards
  cardPadding: 16, // 16px inside cards
  cardMargin: 16, // 16px between cards
  sectionSpacing: 24, // 24px vertical padding between sections
  
  // Tab navigation spacing
  tabHorizontal: 20,
  tabVertical: 16,
  
  // Touch targets
  minTouchTarget: 44, // Minimum 44x44px touch area
  buttonHeight: 44, // Standard button height
  
  // Component spacing
  itemSpacing: 16,
  rowMinHeight: 44, // Minimum height for list rows
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16, // Standard card border radius
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const Shadow = {
  // Standard card shadow - soft elevation
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
    },
    android: {
      elevation: 3,
    },
  }),
  light: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
    android: {
      elevation: 3,
    },
  }),
  medium: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
  }),
  heavy: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
    },
    android: {
      elevation: 6,
    },
  }),
  nav: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: {
      elevation: 5,
    },
  }),
};