/**
 * Debounce Utility
 * Prevents function from being called too frequently
 * Useful for preventing rapid user interactions from causing performance issues
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * 
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function debounced(...args: Parameters<T>) {
    // Clear the previous timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Set a new timeout
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 * Unlike debounce, throttle ensures the function is called periodically.
 * 
 * @param func - The function to throttle
 * @param wait - The number of milliseconds to wait between calls
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return function throttled(...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= wait) {
      // Enough time has passed, call immediately
      lastCallTime = now;
      func(...args);
    } else {
      // Schedule call for later if not already scheduled
      if (timeoutId === null) {
        timeoutId = setTimeout(() => {
          lastCallTime = Date.now();
          func(...args);
          timeoutId = null;
        }, wait - timeSinceLastCall);
      }
    }
  };
}

