/**
 * Logger Utility
 * Provides conditional logging for development vs production
 */

/**
 * Logs a message only in development mode
 */
export const log = (...args: any[]) => {
  if (__DEV__) {
    console.log(...args);
  }
};

/**
 * Logs a warning only in development mode
 */
export const warn = (...args: any[]) => {
  if (__DEV__) {
    console.warn(...args);
  }
};

/**
 * Always logs errors (even in production)
 * Errors should always be logged for debugging
 */
export const error = (...args: any[]) => {
  console.error(...args);
};

/**
 * Logs info messages only in development mode
 */
export const info = (...args: any[]) => {
  if (__DEV__) {
    console.info(...args);
  }
};

/**
 * Groups console logs (development only)
 */
export const group = (label: string, fn: () => void) => {
  if (__DEV__) {
    console.group(label);
    fn();
    console.groupEnd();
  } else {
    fn();
  }
};

