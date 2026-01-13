/**
 * Global modal animation configuration
 * Ensures consistent, smooth animations across all modals
 * 
 * @deprecated Use utils/modalAnimations.ts for new code
 * This file is kept for backward compatibility
 */

import { MODAL_ANIMATIONS } from '@/utils/modalAnimations';

export const modalConfig = {
  // Slide up animation for bottom sheets
  bottomSheet: {
    animationType: MODAL_ANIMATIONS.slide.type,
    presentationStyle: MODAL_ANIMATIONS.slide.presentationStyle,
    statusBarTranslucent: false,
  },
  
  // Fade animation for overlays
  overlay: {
    animationType: 'fade' as const,
    transparent: true,
    statusBarTranslucent: false,
  },
  
  // Smooth transition duration (standardized)
  transitionDuration: 300, // Updated to match standard duration
  
  // Backdrop opacity
  backdropOpacity: 0.4,
};

