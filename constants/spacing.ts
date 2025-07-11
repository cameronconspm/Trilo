import { Platform } from 'react-native';

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  
  // Screen margins - Updated for better mobile spacing
  screenHorizontal: 24, // Increased from 20 to 24px for better horizontal padding
  screenTop: Platform.OS === 'ios' ? 60 : 48, // Improved top spacing for Android
  screenBottom: Platform.OS === 'ios' ? 120 : 100,
  
  // Tab navigation spacing
  tabHorizontal: 20, // 20px padding between icons and screen edges
  tabVertical: 16, // Vertical padding for tab items
  
  // Touch targets
  minTouchTarget: 44, // Minimum 44x44px touch area
  
  // Component spacing
  cardPadding: 20,
  sectionSpacing: 32,
  itemSpacing: 16,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const Shadow = {
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