import { Transaction, IncomeTransaction } from '@/types/finance';
import { calculateNextPayDate } from '@/utils/payScheduleUtils';

export interface PayPeriod {
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  displayText: string;
}

export interface PayPeriodCalculationResult {
  periods: PayPeriod[];
  error?: string;
}

/**
 * Calculate pay periods based on income transactions
 * @param transactions - Array of all transactions
 * @returns PayPeriodCalculationResult with calculated periods
 */
export function calculatePayPeriods(
  transactions: Transaction[]
): PayPeriodCalculationResult {
  try {
    // Filter and sort income transactions by date
    const incomeTransactions = transactions
      .filter((t): t is IncomeTransaction => t.type === 'income')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (incomeTransactions.length === 0) {
      return {
        periods: [],
        error: 'No income transactions found',
      };
    }

    const periods: PayPeriod[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate comparison

    // Generate additional future income dates for recurring income
    const allIncomeTransactions: Transaction[] = [...incomeTransactions];

    // For recurring income, generate future dates
    incomeTransactions.forEach(income => {
      if (income.isRecurring && income.paySchedule) {
        try {
          const lastDate = new Date(income.date);
          let currentDate = lastDate;

          // Generate multiple future dates to ensure we have enough coverage
          for (let i = 0; i < 6; i++) {
            // Generate up to 6 future pay dates
            const result = calculateNextPayDate(
              income.paySchedule,
              currentDate
            );

            if (!result.isValid) {
              break; // Stop if we can't calculate further
            }

            const futureDate = result.date;

            // Add future income if it's within the next 6 months
            const sixMonthsFromNow = new Date();
            sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

            if (futureDate <= sixMonthsFromNow && futureDate > currentDate) {
              allIncomeTransactions.push({
                ...income,
                id: `${income.id}_future_${i}`,
                date: futureDate.toISOString(),
              });
              currentDate = futureDate;
            } else {
              break;
            }
          }
        } catch (error) {
          // Silently handle errors for individual income calculations
          // This prevents one bad income from breaking the entire calculation
        }
      }
    });

    // Sort all income transactions (including generated future ones)
    allIncomeTransactions.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    for (let i = 0; i < allIncomeTransactions.length; i++) {
      const currentIncome = allIncomeTransactions[i];
      const nextIncome = allIncomeTransactions[i + 1];

      let startDate = new Date(currentIncome.date);
      startDate.setHours(0, 0, 0, 0);
      
      // If this is the first period and the income date is in the future but within 6 months,
      // adjust the start date to be before today to create an active period
      // Only do this for recurring income with a schedule
      if (i === 0 && startDate > today && currentIncome.isRecurring && currentIncome.paySchedule) {
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
        
        // Only create an active period if the income is within 6 months
        if (startDate <= sixMonthsFromNow) {
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
        }
      }

      let endDate: Date;
      let displayText: string;

      if (nextIncome) {
        // End the day before the next income
        endDate = new Date(nextIncome.date);
        endDate.setDate(endDate.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);

        displayText = `${formatDateShort(startDate)} – ${formatDateShort(endDate)}`;
      } else {
        // Last income period - check if today is after this income date
        if (today >= startDate) {
          // Instead of extending 6 months into the future, calculate the next expected pay date
          // and use that as the end date for a more reasonable pay period
          let nextPayDate: Date;
          
          try {
            // Calculate the next pay date based on the income's pay schedule
            const incomeTransaction = transactions.find(t => 
              t.type === 'income' && 
              new Date(t.date).getTime() === startDate.getTime()
            );
            
            if (incomeTransaction && incomeTransaction.paySchedule) {
              // Calculate next pay date from the start date
              const nextDate = calculateNextPayDate(incomeTransaction.paySchedule, startDate);
              if (nextDate.isValid) {
                nextPayDate = nextDate.date;
                // End the day before the next pay date
                nextPayDate.setDate(nextPayDate.getDate() - 1);
                nextPayDate.setHours(23, 59, 59, 999);
                displayText = `${formatDateShort(startDate)} – ${formatDateShort(nextPayDate)}`;
              } else {
                // Fallback: use 1 month from start date
                nextPayDate = new Date(startDate);
                nextPayDate.setMonth(nextPayDate.getMonth() + 1);
                nextPayDate.setHours(23, 59, 59, 999);
                displayText = `${formatDateShort(startDate)} – ${formatDateShort(nextPayDate)}`;
              }
            } else {
              // Fallback: use 1 month from start date
              nextPayDate = new Date(startDate);
              nextPayDate.setMonth(nextPayDate.getMonth() + 1);
              nextPayDate.setHours(23, 59, 59, 999);
              displayText = `${formatDateShort(startDate)} – ${formatDateShort(nextPayDate)}`;
            }
          } catch (error) {
            // Fallback: use 1 month from start date
            nextPayDate = new Date(startDate);
            nextPayDate.setMonth(nextPayDate.getMonth() + 1);
            nextPayDate.setHours(23, 59, 59, 999);
            displayText = `${formatDateShort(startDate)} – ${formatDateShort(nextPayDate)}`;
          }
          
          endDate = nextPayDate;
        } else {
          displayText = formatDateShort(startDate);
          endDate = new Date(2099, 11, 31); // Far future date for comparison
        }
      }

      // A period is active if today falls within it
      const isActive = today >= startDate && today <= endDate;

      periods.push({
        startDate,
        endDate,
        isActive,
        displayText,
      });
    }
    
    // Check if the active period is a gap period (too short and between generated future dates)
    // If so, merge it with the previous period or extend the previous period to include today
    const activePeriodIndex = periods.findIndex(p => p.isActive);
    if (activePeriodIndex > 0) {
      const activePeriod = periods[activePeriodIndex];
      const previousPeriod = periods[activePeriodIndex - 1];
      
      // Check if active period is a gap (less than 2 days and starts right after previous period ends)
      const periodDurationMs = activePeriod.endDate.getTime() - activePeriod.startDate.getTime();
      const daysBetween = (activePeriod.startDate.getTime() - previousPeriod.endDate.getTime()) / (1000 * 60 * 60 * 24);
      const isGapPeriod = periodDurationMs < 2 * 24 * 60 * 60 * 1000 && daysBetween < 1.5;
      
      if (isGapPeriod) {
        // Merge active period with previous period
        previousPeriod.endDate = activePeriod.endDate;
        previousPeriod.isActive = true;
        previousPeriod.displayText = `${formatDateShort(previousPeriod.startDate)} – ${formatDateShort(previousPeriod.endDate)}`;
        
        // Remove the gap period
        periods.splice(activePeriodIndex, 1);
      }
    }
    
    // If no active period exists, create one from the past to the first income date
    // This handles the case where the first income is in the future
    // Only do this if the income is recurring (we know it will happen) AND within 6 months
    const hasActivePeriod = periods.some(p => p.isActive);
    if (!hasActivePeriod && periods.length > 0 && allIncomeTransactions.length > 0) {
      const firstIncome = allIncomeTransactions[0];
      const firstIncomeDate = new Date(firstIncome.date);
      
      // Check if income is within 12 months
      const twelveMonthsFromNow = new Date();
      twelveMonthsFromNow.setMonth(twelveMonthsFromNow.getMonth() + 12);
      
      // Only create fallback if: income is recurring AND in the future AND within 12 months
      if (firstIncomeDate > today && 
          firstIncomeDate <= twelveMonthsFromNow &&
          firstIncome.type === 'income' && 
          firstIncome.isRecurring) {
        const fallbackStart = new Date();
        fallbackStart.setDate(fallbackStart.getDate() - 30);
        fallbackStart.setHours(0, 0, 0, 0);
        
        const fallbackEnd = new Date(firstIncomeDate);
        fallbackEnd.setDate(fallbackEnd.getDate() - 1);
        fallbackEnd.setHours(23, 59, 59, 999);
        
        // Insert at the beginning
        periods.unshift({
          startDate: fallbackStart,
          endDate: fallbackEnd,
          isActive: true,
          displayText: `${formatDateShort(fallbackStart)} – ${formatDateShort(fallbackEnd)}`,
        });
      }
    }

    return { periods };
  } catch (error) {
    return {
      periods: [],
      error: `Failed to calculate pay periods: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export function getCurrentPayPeriod(
  transactions: Transaction[]
): PayPeriod | null {
  const result = calculatePayPeriods(transactions);
  if (result.error) {
    // Don't log as error if it's just no income transactions - this is normal
    if (result.error !== 'No income transactions found') {
      console.error('Error getting current pay period:', result.error);
    }
    return null;
  }
  return result.periods.find(period => period.isActive) || null;
}

function formatDateShort(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}
