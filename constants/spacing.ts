import { Platform, Dimensions } from 'react-native';

// Responsive breakpoints for different screen sizes
export const ResponsiveBreakpoints = {
  small: 375,    // iPhone SE, small Android
  medium: 414,   // iPhone 12/13/14
  large: 428,    // iPhone 12/13/14 Pro Max
  tablet: 768,   // iPad
} as const;

// Get current screen dimensions
export const getScreenDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

// Dynamic spacing based on screen size
export const getResponsiveSpacing = (screenWidth: number) => ({
  // Screen-specific spacing
  screenHorizontal: screenWidth < ResponsiveBreakpoints.small ? 12 : 
                    screenWidth < ResponsiveBreakpoints.tablet ? 16 : 24,
  screenTop: Platform.OS === 'ios' ? 
              (screenWidth < ResponsiveBreakpoints.small ? 50 : 60) : 
              (screenWidth < ResponsiveBreakpoints.small ? 40 : 48),
  screenBottom: Platform.OS === 'ios' ? 
                (screenWidth < ResponsiveBreakpoints.small ? 100 : 120) : 
                (screenWidth < ResponsiveBreakpoints.small ? 80 : 100),
  
  // Component spacing
  cardPadding: screenWidth < ResponsiveBreakpoints.small ? 12 : 16,
  cardMargin: screenWidth < ResponsiveBreakpoints.small ? 8 : 12,
  sectionSpacing: screenWidth < ResponsiveBreakpoints.small ? 20 : 24,
  tabHorizontal: screenWidth < ResponsiveBreakpoints.small ? 16 : 20,
  tabVertical: screenWidth < ResponsiveBreakpoints.small ? 12 : 16,
  itemSpacing: screenWidth < ResponsiveBreakpoints.small ? 8 : 12,
  rowMinHeight: screenWidth < ResponsiveBreakpoints.small ? 40 : 44,
  modalPadding: screenWidth < ResponsiveBreakpoints.small ? 20 : 24,
  modalRadius: screenWidth < ResponsiveBreakpoints.small ? 16 : 20,
  minTouchTarget: 44, // Apple's minimum touch target (44x44pt)
  
  // Spacing scale values
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
});

// Dynamic typography based on screen size
export const getResponsiveTypography = (screenWidth: number) => ({
  largeTitle: {
    fontSize: screenWidth < ResponsiveBreakpoints.small ? 28 : 
              screenWidth < ResponsiveBreakpoints.tablet ? 32 : 34,
    fontWeight: '700' as const,
    letterSpacing: -0.41,
    lineHeight: screenWidth < ResponsiveBreakpoints.small ? 34 : 
                screenWidth < ResponsiveBreakpoints.tablet ? 38 : 41,
  },
  h1: {
    fontSize: screenWidth < ResponsiveBreakpoints.small ? 22 : 
              screenWidth < ResponsiveBreakpoints.tablet ? 26 : 28,
    fontWeight: '700' as const,
    letterSpacing: -0.34,
    lineHeight: screenWidth < ResponsiveBreakpoints.small ? 28 : 
                screenWidth < ResponsiveBreakpoints.tablet ? 32 : 34,
  },
  h2: {
    fontSize: screenWidth < ResponsiveBreakpoints.small ? 18 : 
              screenWidth < ResponsiveBreakpoints.tablet ? 20 : 22,
    fontWeight: '600' as const,
    letterSpacing: -0.22,
    lineHeight: screenWidth < ResponsiveBreakpoints.small ? 24 : 
                screenWidth < ResponsiveBreakpoints.tablet ? 26 : 28,
  },
  h3: {
    fontSize: screenWidth < ResponsiveBreakpoints.small ? 16 : 
              screenWidth < ResponsiveBreakpoints.tablet ? 18 : 20,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    lineHeight: screenWidth < ResponsiveBreakpoints.small ? 20 : 
                screenWidth < ResponsiveBreakpoints.tablet ? 22 : 24,
  },
  body: {
    fontSize: screenWidth < ResponsiveBreakpoints.small ? 15 : 17,
    fontWeight: '400' as const,
    letterSpacing: -0.41,
    lineHeight: screenWidth < ResponsiveBreakpoints.small ? 20 : 22,
  },
  bodyMedium: {
    fontSize: screenWidth < ResponsiveBreakpoints.small ? 15 : 17,
    fontWeight: '500' as const,
    letterSpacing: -0.41,
    lineHeight: screenWidth < ResponsiveBreakpoints.small ? 20 : 22,
  },
  bodySmall: {
    fontSize: screenWidth < ResponsiveBreakpoints.small ? 13 : 15,
    fontWeight: '400' as const,
    letterSpacing: -0.24,
    lineHeight: screenWidth < ResponsiveBreakpoints.small ? 18 : 20,
  },
  callout: {
    fontSize: screenWidth < ResponsiveBreakpoints.small ? 14 : 16,
    fontWeight: '400' as const,
    letterSpacing: -0.32,
    lineHeight: screenWidth < ResponsiveBreakpoints.small ? 19 : 21,
  },
  subhead: {
    fontSize: screenWidth < ResponsiveBreakpoints.small ? 13 : 15,
    fontWeight: '400' as const,
    letterSpacing: -0.24,
    lineHeight: screenWidth < ResponsiveBreakpoints.small ? 18 : 20,
  },
  footnote: {
    fontSize: screenWidth < ResponsiveBreakpoints.small ? 11 : 13,
    fontWeight: '400' as const,
    letterSpacing: -0.08,
    lineHeight: screenWidth < ResponsiveBreakpoints.small ? 16 : 18,
  },
  caption: {
    fontSize: screenWidth < ResponsiveBreakpoints.small ? 10 : 12,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: screenWidth < ResponsiveBreakpoints.small ? 14 : 16,
  },
  captionSmall: {
    fontSize: screenWidth < ResponsiveBreakpoints.small ? 9 : 11,
    fontWeight: '400' as const,
    letterSpacing: 0.07,
    lineHeight: screenWidth < ResponsiveBreakpoints.small ? 12 : 13,
  },
  label: {
    fontSize: screenWidth < ResponsiveBreakpoints.small ? 11 : 13,
    fontWeight: '500' as const,
    letterSpacing: -0.08,
    lineHeight: screenWidth < ResponsiveBreakpoints.small ? 16 : 18,
  },
  currency: {
    fontSize: screenWidth < ResponsiveBreakpoints.small ? 26 : 
              screenWidth < ResponsiveBreakpoints.tablet ? 30 : 32,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: screenWidth < ResponsiveBreakpoints.small ? 32 : 
                screenWidth < ResponsiveBreakpoints.tablet ? 36 : 38,
  },
  currencyMedium: {
    fontSize: screenWidth < ResponsiveBreakpoints.small ? 20 : 
              screenWidth < ResponsiveBreakpoints.tablet ? 22 : 24,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
    lineHeight: screenWidth < ResponsiveBreakpoints.small ? 26 : 
                screenWidth < ResponsiveBreakpoints.tablet ? 28 : 30,
  },
  currencySmall: {
    fontSize: screenWidth < ResponsiveBreakpoints.small ? 15 : 17,
    fontWeight: '600' as const,
    letterSpacing: -0.41,
    lineHeight: screenWidth < ResponsiveBreakpoints.small ? 20 : 22,
  },
});

// Type definitions for better type safety
export interface SpacingScale {
  xs: 4;
  sm: 8;
  md: 12;
  lg: 16;
  xl: 20;
  xxl: 24;
  xxxl: 32;
  xxxxl: 48;
}

export interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
}

export interface AndroidShadowStyle {
  elevation: number;
}

export const Spacing: SpacingScale = {
  // Apple HIG Spacing Scale
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
} as const;

export const SpacingValues = {
  // Global UI Standards - Apple HIG compliant
  screenHorizontal: 16, // Standard iOS screen padding
  screenTop: Platform.OS === 'ios' ? 60 : 48,
  screenBottom: Platform.OS === 'ios' ? 120 : 100,

  // Card standards - Apple HIG spacing
  cardPadding: 16, // Reduced from 20 for denser layout
  cardMargin: 12, // Reduced from 16 for tighter spacing
  sectionSpacing: 24, // Reduced from 32 for denser sections

  // Tab navigation spacing - Apple HIG compliant
  tabHorizontal: 20,
  tabVertical: 16,

  // Touch targets - Apple accessibility standards
  minTouchTarget: 44, // Apple's minimum touch target (44x44pt)
  buttonHeight: 48, // Apple's recommended button height

  // Component spacing - Apple HIG consistency
  itemSpacing: 12, // Reduced from 16 for denser layout
  rowMinHeight: 44, // Reduced from 48 for tighter rows

  // Typography spacing - Apple HIG line heights
  textLineHeight: {
    tight: 1.2, // For headings
    normal: 1.4, // For body text
    relaxed: 1.6, // For large text
  },

  // Modal and overlay spacing - Apple HIG
  modalPadding: 24,
  modalRadius: 28, // Apple's modern modal corner radius
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28, // Apple's modern large card corner radius
  full: 9999,
  modern: 12, // Modern iOS-style border radius for toggles and buttons
} as const;

export const Shadow = {
  // Standard card shadow - refined for better depth perception
  card: Platform.select<ShadowStyle | AndroidShadowStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8, // Increased from 6px for softer shadows
    },
    android: {
      elevation: 4, // Increased from 3 for better depth
    },
  }),
  light: Platform.select<ShadowStyle | AndroidShadowStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
  }),
  medium: Platform.select<ShadowStyle | AndroidShadowStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1, // Increased from 0.08 for better depth
      shadowRadius: 12, // Increased from 8px for softer shadows
    },
    android: {
      elevation: 6, // Increased from 4 for better depth
    },
  }),
  heavy: Platform.select<ShadowStyle | AndroidShadowStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12, // Increased from 0.1 for better depth
      shadowRadius: 16, // Increased from 12px for softer shadows
    },
    android: {
      elevation: 8, // Increased from 6 for better depth
    },
  }),
  nav: Platform.select<ShadowStyle | AndroidShadowStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1, // Increased from 0.08 for better depth
      shadowRadius: 12, // Increased from 8px for softer shadows
    },
    android: {
      elevation: 6, // Increased from 5 for better depth
    },
  }),
} as const;

// Apple HIG Typography Scale - SF Pro Display & SF Pro Text
export const Typography = {
  // Apple SF Pro Display - Large Title (34pt)
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    letterSpacing: -0.41,
    lineHeight: 41,
  },
  // Apple SF Pro Display - Title 1 (28pt)
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.34,
    lineHeight: 34,
  },
  // Apple SF Pro Display - Title 2 (22pt)
  h2: {
    fontSize: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.22,
    lineHeight: 28,
  },
  // Apple SF Pro Display - Title 3 (20pt)
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  // Apple SF Pro Text - Body (17pt)
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    letterSpacing: -0.41,
    lineHeight: 22,
  },
  bodyMedium: {
    fontSize: 17,
    fontWeight: '500' as const,
    letterSpacing: -0.41,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 15,
    fontWeight: '400' as const,
    letterSpacing: -0.24,
    lineHeight: 20,
  },
  // Apple SF Pro Text - Callout (16pt)
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: -0.32,
    lineHeight: 21,
  },
  // Apple SF Pro Text - Subhead (15pt)
  subhead: {
    fontSize: 15,
    fontWeight: '400' as const,
    letterSpacing: -0.24,
    lineHeight: 20,
  },
  // Apple SF Pro Text - Footnote (13pt)
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    letterSpacing: -0.08,
    lineHeight: 18,
  },
  // Apple SF Pro Text - Caption 1 (12pt)
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 16,
  },
  // Apple SF Pro Text - Caption 2 (11pt)
  captionSmall: {
    fontSize: 11,
    fontWeight: '400' as const,
    letterSpacing: 0.07,
    lineHeight: 13,
  },
  // Custom label for form elements
  label: {
    fontSize: 13,
    fontWeight: '500' as const,
    letterSpacing: -0.08,
    lineHeight: 18,
  },
  // Currency display - optimized for financial data
  currency: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  currencyMedium: {
    fontSize: 24,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
    lineHeight: 30,
  },
  currencySmall: {
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.41,
    lineHeight: 22,
  },
};
