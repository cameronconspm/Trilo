/**
 * Navigation State Utility
 * Handles persistence of last screen for quick app reopens
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { NAVIGATION_STATE_TIMEOUTS } from '@/constants/timing';
import { COMMON_STORAGE_KEYS } from '@/utils/storageKeys';

const NAVIGATION_STATE_KEY = COMMON_STORAGE_KEYS.NAVIGATION_STATE;
const QUICK_REOPEN_TIMEOUT = NAVIGATION_STATE_TIMEOUTS.QUICK_REOPEN_WINDOW;

interface NavigationState {
  lastScreen: string;
  timestamp: number;
}

/**
 * Save the last screen the user was on
 */
export async function saveLastScreen(screen: string): Promise<void> {
  try {
    const state: NavigationState = {
      lastScreen: screen,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    // Silently fail - navigation state is not critical
    if (__DEV__) {
      console.warn('Failed to save navigation state:', error);
    }
  }
}

/**
 * Get the last screen if app was reopened quickly
 * Returns null if not a quick reopen or if no saved state
 */
export async function getLastScreenForQuickReopen(): Promise<string | null> {
  try {
    const stored = await AsyncStorage.getItem(NAVIGATION_STATE_KEY);
    if (!stored) {
      return null;
    }

    const state: NavigationState = JSON.parse(stored);
    const now = Date.now();
    const timeSinceLastScreen = now - state.timestamp;

    // Only return last screen if within quick reopen timeout
    if (timeSinceLastScreen <= QUICK_REOPEN_TIMEOUT) {
      return state.lastScreen;
    }

    // Clear old state if timeout expired
    await AsyncStorage.removeItem(NAVIGATION_STATE_KEY);
    return null;
  } catch (error) {
    // Silently fail - navigation state is not critical
    if (__DEV__) {
      console.warn('Failed to get navigation state:', error);
    }
    return null;
  }
}

/**
 * Clear the saved navigation state
 */
export async function clearNavigationState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(NAVIGATION_STATE_KEY);
  } catch (error) {
    // Silently fail
    if (__DEV__) {
      console.warn('Failed to clear navigation state:', error);
    }
  }
}

/**
 * Setup AppState listener to clear navigation state when app is backgrounded for too long
 */
export function setupNavigationStateCleanup(): () => void {
  let backgroundTime: number | null = null;

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App is going to background - record time
      backgroundTime = Date.now();
    } else if (nextAppState === 'active' && backgroundTime !== null) {
      // App is coming to foreground - check if too much time passed
      const timeInBackground = Date.now() - backgroundTime;
      if (timeInBackground > QUICK_REOPEN_TIMEOUT) {
        // Too much time passed, clear navigation state
        clearNavigationState();
      }
      backgroundTime = null;
    }
  };

  const subscription = AppState.addEventListener('change', handleAppStateChange);

  return () => {
    subscription.remove();
  };
}

