/**
 * Global modal animation configuration
 * Ensures consistent, smooth animations across all modals
 */

export const modalConfig = {
  // Slide up animation for bottom sheets
  bottomSheet: {
    animationType: 'slide' as const,
    presentationStyle: 'pageSheet' as const,
    statusBarTranslucent: false,
  },
  
  // Fade animation for overlays
  overlay: {
    animationType: 'fade' as const,
    transparent: true,
    statusBarTranslucent: false,
  },
  
  // Smooth transition duration
  transitionDuration: 250,
  
  // Backdrop opacity
  backdropOpacity: 0.4,
};

