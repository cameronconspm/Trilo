import { useWindowDimensions } from 'react-native';
import { ResponsiveBreakpoints, getResponsiveSpacing, getResponsiveTypography } from '@/constants/spacing';

export function useResponsiveDesign() {
  const { width, height } = useWindowDimensions();
  
  const isSmallScreen = width < ResponsiveBreakpoints.small;
  const isMediumScreen = width >= ResponsiveBreakpoints.small && width < ResponsiveBreakpoints.medium;
  const isLargeScreen = width >= ResponsiveBreakpoints.medium && width < ResponsiveBreakpoints.large;
  const isTablet = width >= ResponsiveBreakpoints.tablet;
  
  return {
    // Screen dimensions
    screenWidth: width,
    screenHeight: height,
    
    // Screen size breakpoints
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    isTablet,
    
    // Responsive values
    spacing: getResponsiveSpacing(width),
    typography: getResponsiveTypography(width),
    
    // Quick access to common responsive values
    isCompact: isSmallScreen,
    isStandard: !isSmallScreen && !isTablet,
    isExpanded: isTablet,
  };
}
