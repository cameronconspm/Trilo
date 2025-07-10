/**
 * Utility functions for date calculations and weekly income scheduling
 */

/**
 * Get the date for a specific week and day of the month
 * @param year - The year
 * @param month - The month (0-11, JavaScript month format)
 * @param weekNumber - Week of the month (1-4)
 * @param weekDay - Day of the week ('monday', 'tuesday', etc.)
 * @returns Date object for the specified week and day
 */
export function getDateFromWeekAndDay(
  year: number,
  month: number,
  weekNumber: number,
  weekDay: string
): Date {
  // Convert weekDay string to JavaScript day number (0 = Sunday, 1 = Monday, etc.)
  const dayMap: { [key: string]: number } = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  
  const targetDayOfWeek = dayMap[weekDay.toLowerCase()];
  if (targetDayOfWeek === undefined) {
    throw new Error(`Invalid weekDay: ${weekDay}`);
  }
  
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
    return new Date(year, month, 1 + daysToAdd - 7);
  }
  
  return resultDate;
}

/**
 * Get the current week number of the month (1-4)
 * @param date - The date to check
 * @returns Week number (1-4)
 */
export function getWeekOfMonth(date: Date): number {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfMonth = date.getDate();
  const firstDayOfWeek = firstDayOfMonth.getDay();
  
  // Calculate which week this day falls into
  const weekNumber = Math.ceil((dayOfMonth + firstDayOfWeek) / 7);
  
  return Math.min(weekNumber, 4); // Cap at week 4
}

/**
 * Get the day of the week as a string
 * @param date - The date to check
 * @returns Day of the week ('monday', 'tuesday', etc.)
 */
export function getDayOfWeekString(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

/**
 * Calculate the actual date for an income transaction based on week and day
 * @param weekNumber - Week of the month (1-4)
 * @param weekDay - Day of the week ('monday', 'tuesday', etc.)
 * @param referenceDate - Optional reference date (defaults to current date)
 * @returns ISO string of the calculated date
 */
export function calculateIncomeDate(
  weekNumber: number,
  weekDay: string,
  referenceDate: Date = new Date()
): string {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  
  const incomeDate = getDateFromWeekAndDay(year, month, weekNumber, weekDay);
  return incomeDate.toISOString();
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