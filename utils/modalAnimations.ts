/**
 * Centralized Modal Animation Configuration
 * 
 * Ensures consistent, smooth animations across all modals and popups
 * Following Apple Human Interface Guidelines for animation timing and easing
 */

import React from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Animation timing constants (following Apple HIG)
 * - Quick interactions: 200-250ms
 * - Standard transitions: 300ms
 * - Complex animations: 400ms+
 */
export const ANIMATION_DURATION = {
  fast: 200,      // Quick feedback (button presses, small changes)
  standard: 300,  // Standard modal transitions (Apple HIG recommended)
  slow: 400,      // Complex animations (page transitions)
} as const;

/**
 * Spring animation configurations
 * - Light: Subtle, quick bounce (for small elements)
 * - Standard: Balanced spring (for modals, cards)
 * - Heavy: Strong bounce (for emphasis)
 */
export const SPRING_CONFIG = {
  light: {
    tension: 100,
    friction: 8,
  },
  standard: {
    tension: 120,
    friction: 10,
  },
  heavy: {
    tension: 150,
    friction: 12,
  },
} as const;

/**
 * Easing functions for smooth animations
 */
export const EASING = {
  // Standard easing (Apple HIG)
  standard: Easing.bezier(0.4, 0.0, 0.2, 1.0),
  // Decelerate (ease-out) - for entrances
  decelerate: Easing.bezier(0.0, 0.0, 0.2, 1.0),
  // Accelerate (ease-in) - for exits
  accelerate: Easing.bezier(0.4, 0.0, 1.0, 1.0),
  // Sharp (ease-in-out) - for quick transitions
  sharp: Easing.bezier(0.4, 0.0, 0.6, 1.0),
} as const;

/**
 * Modal animation presets
 */
export const MODAL_ANIMATIONS = {
  /**
   * Fade animation for overlay modals (alerts, confirmations)
   * - Quick fade in/out
   * - Used for: AlertModal, confirmation dialogs
   */
  fade: {
    enter: {
      duration: ANIMATION_DURATION.standard,
      easing: EASING.decelerate,
    },
    exit: {
      duration: ANIMATION_DURATION.fast,
      easing: EASING.accelerate,
    },
  },

  /**
   * Scale + Fade animation for popup modals
   * - Spring scale with fade
   * - Used for: AlertModal (enhanced), popup notifications
   */
  scaleFade: {
    spring: SPRING_CONFIG.standard,
    fade: {
      duration: ANIMATION_DURATION.standard,
      easing: EASING.decelerate,
    },
    exit: {
      duration: ANIMATION_DURATION.fast,
      easing: EASING.accelerate,
    },
  },

  /**
   * Slide animation for bottom sheets
   * - Native slide animation
   * - Used for: AddTransactionModal, DateExpensesModal, SavingsGoalModal
   */
  slide: {
    type: 'slide' as const,
    presentationStyle: 'pageSheet' as const,
  },
} as const;

/**
 * Create fade animation for modal overlay
 */
export function createFadeAnimation(
  opacityAnim: Animated.Value,
  visible: boolean
): Animated.CompositeAnimation {
  return Animated.timing(opacityAnim, {
    toValue: visible ? 1 : 0,
    duration: visible
      ? MODAL_ANIMATIONS.fade.enter.duration
      : MODAL_ANIMATIONS.fade.exit.duration,
    easing: visible
      ? MODAL_ANIMATIONS.fade.enter.easing
      : MODAL_ANIMATIONS.fade.exit.easing,
    useNativeDriver: true,
  });
}

/**
 * Create scale + fade animation for popup modals
 */
export function createScaleFadeAnimation(
  scaleAnim: Animated.Value,
  opacityAnim: Animated.Value,
  visible: boolean
): Animated.CompositeAnimation {
  if (visible) {
    return Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        ...MODAL_ANIMATIONS.scaleFade.spring,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: MODAL_ANIMATIONS.scaleFade.fade.duration,
        easing: MODAL_ANIMATIONS.scaleFade.fade.easing,
        useNativeDriver: true,
      }),
    ]);
  } else {
    return Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: MODAL_ANIMATIONS.scaleFade.exit.duration,
        easing: MODAL_ANIMATIONS.scaleFade.exit.easing,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: MODAL_ANIMATIONS.scaleFade.exit.duration,
        easing: MODAL_ANIMATIONS.scaleFade.exit.easing,
        useNativeDriver: true,
      }),
    ]);
  }
}

/**
 * Hook for consistent modal animations
 * Returns animated values and animation function
 */
export function useModalAnimation(visible: boolean) {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = createScaleFadeAnimation(scaleAnim, opacityAnim, visible);
    animation.start();

    return () => {
      animation.stop();
    };
  }, [visible, scaleAnim, opacityAnim]);

  return {
    scaleAnim,
    opacityAnim,
    animatedStyle: {
      transform: [{ scale: scaleAnim }],
      opacity: opacityAnim,
    },
  };
}

