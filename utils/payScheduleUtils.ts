import { PaySchedule, PayCadence } from '@/types/finance';

// Type definitions for better type safety
export interface PayDateCalculationResult {
  date: Date;
  isValid: boolean;
  error?: string;
}

export interface PayDatesForMonthResult {
  dates: Date[];
  error?: string;
}

/**
 * Calculate the next pay date based on pay schedule
 * @param paySchedule - The pay schedule configuration
 * @param fromDate - Optional reference date (defaults to current date)
 * @returns PayDateCalculationResult with the calculated date
 */
export function calculateNextPayDate(
  paySchedule: PaySchedule,
  fromDate: Date = new Date()
): PayDateCalculationResult {
  try {
    const lastPaid = new Date(paySchedule.lastPaidDate);

    // Validate the last paid date
    if (isNaN(lastPaid.getTime())) {
      return {
        date: new Date(),
        isValid: false,
        error: 'Invalid last paid date',
      };
    }

    let nextDate: Date;

    switch (paySchedule.cadence) {
      case 'weekly':
        nextDate = addDays(lastPaid, 7);
        break;

      case 'every_2_weeks':
        nextDate = addDays(lastPaid, 14);
        break;

      case 'monthly':
        nextDate = addMonths(lastPaid, 1);
        break;

      case 'twice_monthly':
        nextDate = calculateNextTwiceMonthlyPayDate(paySchedule, fromDate);
        break;

      case 'custom':
        nextDate = calculateNextCustomPayDate(paySchedule, fromDate);
        break;

      default:
        return {
          date: lastPaid,
          isValid: false,
          error: `Unsupported pay cadence: ${paySchedule.cadence}`,
        };
    }

    // Validate the calculated date
    if (isNaN(nextDate.getTime())) {
      return {
        date: new Date(),
        isValid: false,
        error: 'Failed to calculate valid next pay date',
      };
    }

    return {
      date: nextDate,
      isValid: true,
    };
  } catch (error) {
    return {
      date: new Date(),
      isValid: false,
      error: `Pay date calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Calculate all pay dates for a given month
 * @param paySchedule - The pay schedule configuration
 * @param year - The year
 * @param month - The month (0-11, JavaScript month format)
 * @returns PayDatesForMonthResult with calculated dates
 */
export function getPayDatesForMonth(
  paySchedule: PaySchedule,
  year: number,
  month: number
): PayDatesForMonthResult {
  try {
    // Validate inputs
    if (year < 1900 || year > 2100) {
      return {
        dates: [],
        error: 'Invalid year: must be between 1900 and 2100',
      };
    }

    if (month < 0 || month > 11) {
      return {
        dates: [],
        error: 'Invalid month: must be between 0 and 11',
      };
    }

    const payDates: Date[] = [];

    switch (paySchedule.cadence) {
      case 'twice_monthly':
        if (paySchedule.monthlyDays) {
          paySchedule.monthlyDays.forEach(day => {
            const date = new Date(year, month, day);
            if (date.getMonth() === month) {
              // Ensure date is in the correct month
              payDates.push(date);
            }
          });
        }
        break;

      case 'custom':
        if (paySchedule.customDays) {
          paySchedule.customDays.forEach(day => {
            const date = new Date(year, month, day);
            if (date.getMonth() === month) {
              // Ensure date is in the correct month
              payDates.push(date);
            }
          });
        }
        break;

      case 'monthly':
        const lastPaid = new Date(paySchedule.lastPaidDate);
        const monthlyDate = new Date(year, month, lastPaid.getDate());
        if (monthlyDate.getMonth() === month) {
          payDates.push(monthlyDate);
        }
        break;

      case 'weekly':
      case 'every_2_weeks':
        // Calculate all occurrences in the month
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0);
        let currentDate = new Date(paySchedule.lastPaidDate);

        // Find the first pay date in or after the month
        while (currentDate < startOfMonth) {
          const result = calculateNextPayDate({
            ...paySchedule,
            lastPaidDate: currentDate.toISOString(),
          });
          if (!result.isValid) {
            break; // Stop if we can't calculate further
          }
          currentDate = result.date;
        }

        // Add all pay dates within the month
        while (currentDate <= endOfMonth) {
          if (currentDate.getMonth() === month) {
            payDates.push(new Date(currentDate));
          }
          const result = calculateNextPayDate({
            ...paySchedule,
            lastPaidDate: currentDate.toISOString(),
          });
          if (!result.isValid) {
            break; // Stop if we can't calculate further
          }
          currentDate = result.date;
        }
        break;
    }

    return { dates: payDates };
  } catch (error) {
    return {
      dates: [],
      error: `Failed to calculate pay dates for month: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Calculate weekly income for a specific week
 */
export function getWeeklyIncomeAmount(
  paySchedule: PaySchedule,
  amount: number,
  weekStart: Date,
  weekEnd: Date
): number {
  const payDatesInWeek = getPayDatesInRange(paySchedule, weekStart, weekEnd);
  return payDatesInWeek.length * amount;
}

/**
 * Get all pay dates within a date range
 */
export function getPayDatesInRange(
  paySchedule: PaySchedule,
  startDate: Date,
  endDate: Date
): Date[] {
  const payDates: Date[] = [];

  // Get pay dates for each month in the range
  const startMonth = startDate.getMonth();
  const startYear = startDate.getFullYear();
  const endMonth = endDate.getMonth();
  const endYear = endDate.getFullYear();

  for (let year = startYear; year <= endYear; year++) {
    const monthStart = year === startYear ? startMonth : 0;
    const monthEnd = year === endYear ? endMonth : 11;

    for (let month = monthStart; month <= monthEnd; month++) {
      const monthPayDates = getPayDatesForMonth(paySchedule, year, month);
      monthPayDates.dates.forEach(date => {
        if (date >= startDate && date <= endDate) {
          payDates.push(date);
        }
      });
    }
  }

  return payDates.sort((a, b) => a.getTime() - b.getTime());
}

/**
 * Format pay schedule for display
 */
export function formatPaySchedule(paySchedule: PaySchedule): string {
  const lastPaid = new Date(paySchedule.lastPaidDate);
  const lastPaidStr = lastPaid.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  switch (paySchedule.cadence) {
    case 'weekly':
      return `Weekly (last paid ${lastPaidStr})`;

    case 'every_2_weeks':
      return `Every 2 weeks (last paid ${lastPaidStr})`;

    case 'monthly':
      return `Monthly on the ${lastPaid.getDate()}${getOrdinalSuffix(lastPaid.getDate())}`;

    case 'twice_monthly':
      if (paySchedule.monthlyDays) {
        const days = paySchedule.monthlyDays
          .map(day => `${day}${getOrdinalSuffix(day)}`)
          .join(' & ');
        return `Twice monthly (${days})`;
      }
      return 'Twice monthly';

    case 'custom':
      if (paySchedule.customDays) {
        const days = paySchedule.customDays
          .map(day => `${day}${getOrdinalSuffix(day)}`)
          .join(', ');
        return `Custom (${days})`;
      }
      return 'Custom schedule';

    default:
      return 'Unknown schedule';
  }
}

// Helper functions
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function calculateNextTwiceMonthlyPayDate(
  paySchedule: PaySchedule,
  fromDate: Date
): Date {
  if (!paySchedule.monthlyDays || paySchedule.monthlyDays.length === 0) {
    return fromDate;
  }

  const currentMonth = fromDate.getMonth();
  const currentYear = fromDate.getFullYear();
  const currentDay = fromDate.getDate();

  // Find the next pay day in the current month
  const nextDayInMonth = paySchedule.monthlyDays.find(day => day > currentDay);

  if (nextDayInMonth) {
    return new Date(currentYear, currentMonth, nextDayInMonth);
  } else {
    // Move to next month, use first pay day
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    return new Date(nextYear, nextMonth, paySchedule.monthlyDays[0]);
  }
}

function calculateNextCustomPayDate(
  paySchedule: PaySchedule,
  fromDate: Date
): Date {
  if (!paySchedule.customDays || paySchedule.customDays.length === 0) {
    return fromDate;
  }

  const currentMonth = fromDate.getMonth();
  const currentYear = fromDate.getFullYear();
  const currentDay = fromDate.getDate();

  // Find the next pay day in the current month
  const nextDayInMonth = paySchedule.customDays.find(day => day > currentDay);

  if (nextDayInMonth) {
    return new Date(currentYear, currentMonth, nextDayInMonth);
  } else {
    // Move to next month, use first pay day
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    return new Date(nextYear, nextMonth, paySchedule.customDays[0]);
  }
}

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
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
