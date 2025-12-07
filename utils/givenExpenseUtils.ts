/**
 * Utility functions for calculating given expense dates based on frequency and day of week
 */

import { GivenExpenseSchedule, GivenExpenseFrequency } from '@/types/finance';

/**
 * Calculate the next occurrence date for a given expense based on its schedule
 * @param schedule - The given expense schedule
 * @param fromDate - Optional reference date (defaults to current date)
 * @returns The next occurrence date
 */
export function calculateNextGivenExpenseDate(
  schedule: GivenExpenseSchedule,
  fromDate: Date = new Date()
): Date {
  const today = new Date(fromDate);
  today.setHours(0, 0, 0, 0);

  // Backward compatibility: extract dayOfWeek from startDate if not present
  let dayOfWeek = schedule.dayOfWeek;
  if (dayOfWeek === undefined) {
    const startDate = new Date(schedule.startDate);
    dayOfWeek = startDate.getDay();
  }

  switch (schedule.frequency) {
    case 'every_week': {
      // Find the next occurrence of the specified day of week
      const currentDayOfWeek = today.getDay();
      
      let daysUntilNext = dayOfWeek - currentDayOfWeek;
      
      // If the day has already passed this week, go to next week
      if (daysUntilNext <= 0) {
        daysUntilNext += 7;
      }
      
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + daysUntilNext);
      return nextDate;
    }

    case 'every_other_week': {
      // Find the next occurrence every other week
      const startDate = new Date(schedule.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      // Calculate weeks since start date
      const weeksSinceStart = Math.floor(
        (today.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      
      // Calculate next occurrence (every other week from start)
      const nextWeekOffset = weeksSinceStart % 2 === 0 && today >= startDate
        ? 2 // If we're on an even week and past/at start, next is in 2 weeks
        : weeksSinceStart % 2 === 1
        ? 1 // If we're on an odd week, next is in 1 week
        : 0; // If we're before start, use start date
      
      const nextDate = new Date(startDate);
      nextDate.setDate(startDate.getDate() + (nextWeekOffset * 7));
      
      // Adjust to the correct day of week (use dayOfWeek from above)
      const daysUntilDay = (dayOfWeek - nextDate.getDay() + 7) % 7;
      if (daysUntilDay !== 0) {
        nextDate.setDate(nextDate.getDate() + daysUntilDay);
      }
      
      // If the calculated date is in the past or today, move to next occurrence
      if (nextDate <= today) {
        nextDate.setDate(nextDate.getDate() + 14); // Add 2 weeks for bi-weekly
      }
      
      return nextDate;
    }

    case 'once_a_month': {
      // Use the startDate's day of month, but find the next occurrence
      const startDate = new Date(schedule.startDate);
      const dayOfMonth = startDate.getDate();
      
      const nextDate = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
      
      // If the date has passed this month, go to next month
      if (nextDate <= today) {
        nextDate.setMonth(nextDate.getMonth() + 1);
        // Handle edge case where day doesn't exist in next month (e.g., Feb 30)
        if (nextDate.getDate() !== dayOfMonth) {
          nextDate.setDate(0); // Move to last day of previous month
        }
      }
      
      return nextDate;
    }

    default:
      return today;
  }
}

/**
 * Calculate all occurrence dates for a given expense within a date range
 * @param schedule - The given expense schedule
 * @param startDate - Start of the range
 * @param endDate - End of the range
 * @returns Array of dates within the range
 */
export function getGivenExpenseDatesInRange(
  schedule: GivenExpenseSchedule,
  startDate: Date,
  endDate: Date
): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // Backward compatibility: extract dayOfWeek from startDate if not present
  let dayOfWeek = schedule.dayOfWeek;
  if (dayOfWeek === undefined) {
    const scheduleStartDate = new Date(schedule.startDate);
    dayOfWeek = scheduleStartDate.getDay();
  }

  switch (schedule.frequency) {
    case 'every_week': {
      // Find first occurrence in range
      const firstDayOfWeek = current.getDay();
      
      let daysUntilFirst = dayOfWeek - firstDayOfWeek;
      if (daysUntilFirst < 0) {
        daysUntilFirst += 7;
      }
      
      let nextDate = new Date(current);
      nextDate.setDate(current.getDate() + daysUntilFirst);
      
      // Add all occurrences in range
      while (nextDate <= end) {
        dates.push(new Date(nextDate));
        nextDate.setDate(nextDate.getDate() + 7);
      }
      break;
    }

    case 'every_other_week': {
      const scheduleStartDate = new Date(schedule.startDate);
      scheduleStartDate.setHours(0, 0, 0, 0);
      
      // Find first occurrence in or after range start
      let checkDate = new Date(Math.max(current.getTime(), scheduleStartDate.getTime()));
      
      // Find the first valid occurrence
      while (checkDate <= end) {
        // Check if this week matches the bi-weekly pattern
        const weeksSinceStart = Math.floor(
          (checkDate.getTime() - scheduleStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
        );
        
        if (weeksSinceStart % 2 === 0 && checkDate.getDay() === dayOfWeek) {
          dates.push(new Date(checkDate));
          checkDate.setDate(checkDate.getDate() + 14); // Skip to next bi-weekly occurrence
        } else {
          checkDate.setDate(checkDate.getDate() + 1);
        }
      }
      break;
    }

    case 'once_a_month': {
      const scheduleStartDate = new Date(schedule.startDate);
      const dayOfMonth = scheduleStartDate.getDate();
      
      let checkDate = new Date(current.getFullYear(), current.getMonth(), dayOfMonth);
      
      // If this month's date is in the past, start from next month
      if (checkDate < current) {
        checkDate.setMonth(checkDate.getMonth() + 1);
      }
      
      // Handle edge case where day doesn't exist in the month
      while (checkDate <= end) {
        if (checkDate.getDate() === dayOfMonth || 
            (dayOfMonth > 28 && checkDate.getDate() === new Date(checkDate.getFullYear(), checkDate.getMonth() + 1, 0).getDate())) {
          dates.push(new Date(checkDate));
        }
        checkDate.setMonth(checkDate.getMonth() + 1);
      }
      break;
    }
  }

  return dates;
}

/**
 * Get a formatted string for displaying the given expense schedule in the Budget tab
 * @param schedule - The given expense schedule
 * @returns Formatted string like "every Thurs" or "every other Fri"
 */
export function formatGivenExpenseSchedule(schedule: GivenExpenseSchedule): string {
  // Backward compatibility: extract dayOfWeek from startDate if not present
  let dayOfWeek = schedule.dayOfWeek;
  if (dayOfWeek === undefined) {
    const startDate = new Date(schedule.startDate);
    dayOfWeek = startDate.getDay();
  }
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = dayNames[dayOfWeek];

  switch (schedule.frequency) {
    case 'every_week':
      return `every ${dayName}`;
    case 'every_other_week':
      return `every other ${dayName}`;
    case 'once_a_month': {
      const startDate = new Date(schedule.startDate);
      const day = startDate.getDate();
      const suffix = getDaySuffix(day);
      return `${day}${suffix} of the month`;
    }
    default:
      return '';
  }
}

/**
 * Helper function to get day suffix (1st, 2nd, 3rd, etc.)
 */
function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return 'th';
  }
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

/**
 * Get the actual date for a given expense in a specific pay period
 * Used for Overview tab to show the specific date
 * @param schedule - The given expense schedule
 * @param payPeriodStart - Start of the pay period
 * @param payPeriodEnd - End of the pay period
 * @returns The date within the pay period, or null if not in period
 */
export function getGivenExpenseDateForPayPeriod(
  schedule: GivenExpenseSchedule,
  payPeriodStart: Date,
  payPeriodEnd: Date
): Date | null {
  const dates = getGivenExpenseDatesInRange(payPeriodStart, payPeriodEnd);
  // Return the first (and usually only) occurrence in the pay period
  return dates.length > 0 ? dates[0] : null;
}

