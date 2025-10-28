/**
 * Utility functions for date calculations and weekly income scheduling
 */

import { WeekDay, WeekNumber } from '@/types/finance';

// Type definitions for better type safety
export interface DateCalculationResult {
  date: Date;
  isValid: boolean;
  error?: string;
}

// Day mapping for consistent day handling
const DAY_MAP: Record<WeekDay, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
} as const;

/**
 * Check if a year is a leap year
 * @param year - The year to check
 * @returns true if leap year, false otherwise
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Get the number of days in a month
 * @param year - The year
 * @param month - The month (0-11, JavaScript month format)
 * @returns Number of days in the month
 */
export function getDaysInMonth(year: number, month: number): number {
  const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  // Handle February leap year case
  if (month === 1 && isLeapYear(year)) {
    return 29;
  }
  
  return monthDays[month];
}

/**
 * Get the first day of the week for a given month
 * @param year - The year
 * @param month - The month (0-11, JavaScript month format)
 * @returns Day of week (0 = Sunday, 1 = Monday, etc.)
 */
export function getFirstWeekday(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/**
 * Calculate the start of week offset for calendar grid
 * @param firstWeekday - First day of the month (0-6)
 * @param weekStart - Configured week start day (0-6)
 * @returns Number of leading blank cells needed
 */
export function getLeadingBlanks(firstWeekday: number, weekStart: number): number {
  // Calculate how many days we need to go back to reach the week start
  // If firstWeekday is 5 (Friday) and weekStart is 0 (Sunday), we need 5 blank cells
  // If firstWeekday is 0 (Sunday) and weekStart is 0 (Sunday), we need 0 blank cells
  let blanks = firstWeekday - weekStart;
  if (blanks < 0) {
    blanks += 7;
  }
  return blanks;
}

/**
 * Generate a complete calendar grid for a month
 * @param year - The year
 * @param month - The month (0-11, JavaScript month format)
 * @param weekStart - Week start day (0 = Sunday, 1 = Monday, etc.)
 * @returns Array of calendar days with proper alignment
 */
export function generateCalendarGrid(
  year: number,
  month: number,
  weekStart: number = 0
): Array<{
  day: number;
  date: Date;
  isCurrentMonth: boolean;
  isOtherMonth: boolean;
}> {
  const daysInMonth = getDaysInMonth(year, month);
  const firstWeekday = getFirstWeekday(year, month);
  
  // Calculate how many days we need to go back to reach the week start
  let leadingBlanks = firstWeekday - weekStart;
  if (leadingBlanks < 0) {
    leadingBlanks += 7;
  }
  
  const calendarDays = [];
  
  // Add leading blank cells from previous month
  for (let i = 0; i < leadingBlanks; i++) {
    const previousMonth = month === 0 ? 11 : month - 1;
    const previousYear = month === 0 ? year - 1 : year;
    const daysInPreviousMonth = getDaysInMonth(previousYear, previousMonth);
    
    // Calculate the correct day from the previous month
    // Start from the end and work backwards
    const day = daysInPreviousMonth - leadingBlanks + i + 1;
    
    calendarDays.push({
      day,
      date: new Date(previousYear, previousMonth, day),
      isCurrentMonth: false,
      isOtherMonth: true,
    });
  }
  
  // Add current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      day,
      date: new Date(year, month, day),
      isCurrentMonth: true,
      isOtherMonth: false,
    });
  }
  
  // Calculate how many cells we need to complete the grid
  const totalCells = leadingBlanks + daysInMonth;
  const cellsNeeded = (7 - (totalCells % 7)) % 7;
  
  // Add trailing blank cells from next month
  for (let day = 1; day <= cellsNeeded; day++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    
    calendarDays.push({
      day,
      date: new Date(nextYear, nextMonth, day),
      isCurrentMonth: false,
      isOtherMonth: true,
    });
  }
  
  return calendarDays;
}

/**
 * Get the date for a specific week and day of the month
 * @param year - The year
 * @param month - The month (0-11, JavaScript month format)
 * @param weekNumber - Week of the month (1-5)
 * @param weekDay - Day of the week
 * @returns DateCalculationResult with the calculated date
 */
export function getDateFromWeekAndDay(
  year: number,
  month: number,
  weekNumber: WeekNumber,
  weekDay: WeekDay
): DateCalculationResult {
  try {
    // Validate inputs
    if (year < 1900 || year > 2100) {
      return {
        date: new Date(),
        isValid: false,
        error: 'Invalid year: must be between 1900 and 2100',
      };
    }

    if (month < 0 || month > 11) {
      return {
        date: new Date(),
        isValid: false,
        error: 'Invalid month: must be between 0 and 11',
      };
    }

    if (weekNumber < 1 || weekNumber > 5) {
      return {
        date: new Date(),
        isValid: false,
        error: 'Invalid week number: must be between 1 and 5',
      };
    }

    const targetDayOfWeek = DAY_MAP[weekDay];

    // Get the first day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayOfWeek = firstDayOfMonth.getDay();

    // Calculate the date of the first occurrence of the target day in the month
    let daysToAdd = targetDayOfWeek - firstDayOfWeek;
    if (daysToAdd < 0) {
      daysToAdd += 7;
    }

    // Add the weeks to get to the desired week number
    daysToAdd += (weekNumber - 1) * 7;

    const resultDate = new Date(year, month, 1 + daysToAdd);

    // Ensure the date is still in the same month
    if (resultDate.getMonth() !== month) {
      // If we've gone into the next month, return the last occurrence in the current month
      const lastValidDate = new Date(year, month, 1 + daysToAdd - 7);
      return {
        date: lastValidDate,
        isValid: true,
      };
    }

    return {
      date: resultDate,
      isValid: true,
    };
  } catch (error) {
    return {
      date: new Date(),
      isValid: false,
      error: `Date calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get the current week number of the month (1-5)
 * @param date - The date to check
 * @returns Week number (1-5)
 */
export function getWeekOfMonth(date: Date): WeekNumber {
  try {
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 1;
    }

    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfMonth = date.getDate();
    const firstDayOfWeek = firstDayOfMonth.getDay();

    // Calculate which week this day falls into
    const weekNumber = Math.ceil((dayOfMonth + firstDayOfWeek) / 7);

    // Cap at week 5 and ensure minimum of 1
    return Math.max(1, Math.min(weekNumber, 5)) as WeekNumber;
  } catch (error) {
    // Return week 1 as fallback
    return 1;
  }
}

/**
 * Get the day of the week as a string
 * @param date - The date to check
 * @returns Day of the week
 */
export function getDayOfWeekString(date: Date): WeekDay {
  try {
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'sunday';
    }

    const days: WeekDay[] = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    return days[date.getDay()];
  } catch (error) {
    // Return sunday as fallback
    return 'sunday';
  }
}

/**
 * Calculate the actual date for an income transaction based on week and day
 * @param weekNumber - Week of the month (1-5)
 * @param weekDay - Day of the week
 * @param referenceDate - Optional reference date (defaults to current date)
 * @returns ISO string of the calculated date
 */
export function calculateIncomeDate(
  weekNumber: WeekNumber,
  weekDay: WeekDay,
  referenceDate: Date = new Date()
): string {
  try {
    // Check if reference date is valid
    if (isNaN(referenceDate.getTime())) {
      return new Date().toISOString();
    }

    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();

    const result = getDateFromWeekAndDay(year, month, weekNumber, weekDay);

    if (!result.isValid) {
      // Fallback to current date if calculation fails
      return new Date().toISOString();
    }

    return result.date.toISOString();
  } catch (error) {
    // Fallback to current date if any error occurs
    return new Date().toISOString();
  }
}

/**
 * Format week and day for display
 * @param weekNumber - Week of the month (1-4)
 * @param weekDay - Day of the week ('monday', 'tuesday', etc.)
 * @returns Formatted string like "Week 2 Friday"
 */
export function formatWeekAndDay(weekNumber: number, weekDay: string): string {
  const capitalizedDay = weekDay.charAt(0).toUpperCase() + weekDay.slice(1);
  return `Week ${weekNumber} ${capitalizedDay}`;
}

/**
 * Sorts transactions by closest date to current date
 * @param transactions Array of transactions to sort
 * @param currentDate Optional current date (defaults to today)
 * @returns Sorted array with closest dates first
 */
export const sortByClosestDate = <T extends { date: string }>(
  transactions: T[],
  currentDate: Date = new Date()
): T[] => {
  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);

  return [...transactions].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    // Set both dates to start of day for accurate comparison
    dateA.setHours(0, 0, 0, 0);
    dateB.setHours(0, 0, 0, 0);
    
    // Calculate days difference from today
    const diffA = Math.abs((dateA.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const diffB = Math.abs((dateB.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Sort by closest date first
    return diffA - diffB;
  });
};

/**
 * Sorts transactions by closest date to current date, with future dates prioritized
 * @param transactions Array of transactions to sort
 * @param currentDate Optional current date (defaults to today)
 * @returns Sorted array with future dates first, then past dates by recency
 */
export const sortByClosestDateWithFuturePriority = <T extends { date: string }>(
  transactions: T[],
  currentDate: Date = new Date()
): T[] => {
  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);

  return [...transactions].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    // Set both dates to start of day for accurate comparison
    dateA.setHours(0, 0, 0, 0);
    dateB.setHours(0, 0, 0, 0);
    
    // Check if dates are in the future or past
    const isAFuture = dateA >= today;
    const isBFuture = dateB >= today;
    
    // Future dates come first
    if (isAFuture && !isBFuture) return -1;
    if (!isAFuture && isBFuture) return 1;
    
    if (isAFuture && isBFuture) {
      // Both future: sort by closest date first
      const diffA = (dateA.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      const diffB = (dateB.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diffA - diffB;
    } else {
      // Both past: sort by most recent first
      return dateB.getTime() - dateA.getTime();
    }
  });
};

/**
 * Filters and sorts transactions with smart date limits:
 * - Shows next 30 days of future expenses
 * - Shows previous 7 days of past expenses
 * - Sorts by closest date with today prioritized
 * @param transactions Array of transactions to filter and sort
 * @param currentDate Optional current date (defaults to today)
 * @returns Filtered and sorted array
 */
export const filterAndSortBySmartDateLimits = <T extends { date: string }>(
  transactions: T[],
  currentDate: Date = new Date()
): T[] => {
  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);
  
  // Calculate date boundaries
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  
  // Filter transactions within the date range
  const filteredTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    transactionDate.setHours(0, 0, 0, 0);
    
    // Include if within 7 days in the past or 30 days in the future
    return transactionDate >= sevenDaysAgo && transactionDate <= thirtyDaysFromNow;
  });
  
  // Sort by smart date logic
  return filteredTransactions.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    // Set both dates to start of day for accurate comparison
    dateA.setHours(0, 0, 0, 0);
    dateB.setHours(0, 0, 0, 0);
    
    // Check if dates are today
    const isAToday = dateA.getTime() === today.getTime();
    const isBToday = dateB.getTime() === today.getTime();
    
    // Today's expenses come first
    if (isAToday && !isBToday) return -1;
    if (!isAToday && isBToday) return 1;
    
    // If both are today or both are not today, sort chronologically
    if (dateA >= today && dateB >= today) {
      // Both are future dates - sort by closest first (ascending)
      return dateA.getTime() - dateB.getTime();
    } else if (dateA < today && dateB < today) {
      // Both are past dates - sort by most recent first (descending)
      return dateB.getTime() - dateA.getTime();
    } else {
      // One is past, one is future - future comes first
      return dateA >= today ? -1 : 1;
    }
  });
};
