/**
 * Timing Constants
 * Centralizes all timeout and interval values used throughout the app
 * Makes it easy to adjust timing values and understand their purpose
 */

/**
 * Navigation and UI Timeouts
 */
export const NAVIGATION_TIMEOUTS = {
  /** Delay before navigating after auth state change (allows state to settle) */
  AUTH_NAVIGATION_DELAY: 100, // ms
  /** Delay before hiding splash screen (ensures native module is ready) */
  SPLASH_SCREEN_HIDE_DELAY: 500, // ms
} as const;

/**
 * State Synchronization Timeouts
 * Used for debouncing state updates and calculations
 */
export const STATE_SYNC_TIMEOUTS = {
  /** Debounce delay for finance calculations (prevents excessive recalculations) */
  FINANCE_CALCULATION_DEBOUNCE: 50, // ms
  /** Delay for state propagation after async operations */
  STATE_PROPAGATION_DELAY: 100, // ms
  /** Delay for setup flow state updates */
  SETUP_STATE_DELAY: 100, // ms
  /** Delay for transaction save verification */
  TRANSACTION_SAVE_DELAY: 100, // ms
  /** Delay for CSV import processing */
  CSV_IMPORT_DELAY: 300, // ms
  /** Delay for final setup completion */
  SETUP_COMPLETION_DELAY: 500, // ms
} as const;

/**
 * Network and API Timeouts
 */
export const NETWORK_TIMEOUTS = {
  /** Exponential backoff base delay for retries */
  RETRY_BASE_DELAY: 1000, // ms
  /** Delay before retrying RevenueCat initialization */
  REVENUECAT_RETRY_DELAY: 500, // ms
  /** Delay before loading RevenueCat packages */
  REVENUECAT_LOAD_DELAY: 1000, // ms
  /** Delay before retrying package load after error */
  REVENUECAT_PACKAGE_RETRY_DELAY: 3000, // ms
} as const;

/**
 * Background Sync Intervals
 */
export const SYNC_INTERVALS = {
  /** Plaid auto-sync interval (15 minutes) */
  PLAID_AUTO_SYNC: 15 * 60 * 1000, // 15 minutes in milliseconds
} as const;

/**
 * Navigation State Timeouts
 */
export const NAVIGATION_STATE_TIMEOUTS = {
  /** Time window for quick app reopen (30 seconds) */
  QUICK_REOPEN_WINDOW: 30000, // 30 seconds in milliseconds
} as const;

/**
 * UI Notification Timeouts
 */
export const NOTIFICATION_TIMEOUTS = {
  /** Default auto-dismiss duration for notifications */
  AUTO_DISMISS_DURATION: 3000, // 3 seconds
} as const;

