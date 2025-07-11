import { Transaction } from '@/types/finance';
import { calculateNextPayDate } from '@/utils/payScheduleUtils';

export interface PayPeriod {
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  displayText: string;
}

export function calculatePayPeriods(transactions: Transaction[]): PayPeriod[] {
  // Filter and sort income transactions by date
  const incomeTransactions = transactions
    .filter(t => t.type === 'income')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (incomeTransactions.length === 0) {
    console.log('PayPeriodUtils: No income transactions found');
    return [];
  }
  
  console.log('PayPeriodUtils: Found', incomeTransactions.length, 'income transactions');
  incomeTransactions.forEach(t => {
    console.log('  Income:', t.name, 'Date:', t.date, 'Recurring:', t.isRecurring, 'PaySchedule:', t.paySchedule);
  });

  const periods: PayPeriod[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time for accurate comparison

  // Generate additional future income dates for recurring income
  const allIncomeTransactions = [...incomeTransactions];
  
  // For recurring income, generate future dates
  incomeTransactions.forEach(income => {
    if (income.isRecurring && income.paySchedule) {
      try {
        const lastDate = new Date(income.date);
        let currentDate = lastDate;
        
        // Generate multiple future dates to ensure we have enough coverage
        for (let i = 0; i < 6; i++) { // Generate up to 6 future pay dates
          const futureDate = calculateNextPayDate(income.paySchedule, currentDate);
          
          // Add future income if it's within the next 6 months
          const sixMonthsFromNow = new Date();
          sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
          
          if (futureDate <= sixMonthsFromNow && futureDate > currentDate) {
            allIncomeTransactions.push({
              ...income,
              id: income.id + '_future_' + i,
              date: futureDate.toISOString()
            });
            currentDate = futureDate;
          } else {
            break;
          }
        }
      } catch (error) {
        console.warn('Error calculating future pay date for income:', income.id, error);
      }
    }
  });
  
  // Sort all income transactions (including generated future ones)
  allIncomeTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  console.log('PayPeriodUtils: All income transactions (including future):', allIncomeTransactions.length);
  allIncomeTransactions.forEach(t => {
    console.log('  All Income:', t.name, 'Date:', t.date);
  });

  for (let i = 0; i < allIncomeTransactions.length; i++) {
    const currentIncome = allIncomeTransactions[i];
    const nextIncome = allIncomeTransactions[i + 1];
    
    const startDate = new Date(currentIncome.date);
    startDate.setHours(0, 0, 0, 0);
    
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
        displayText = `${formatDateShort(startDate)} – Present`;
      } else {
        displayText = formatDateShort(startDate);
      }
      endDate = new Date(2099, 11, 31); // Far future date for comparison
    }
    
    // Check if this period is currently active
    const isActive = today >= startDate && today <= endDate;
    
    console.log(`PayPeriodUtils: Period ${i}: ${displayText}, Active: ${isActive}, Start: ${startDate.toDateString()}, End: ${endDate.toDateString()}`);
    
    periods.push({
      startDate,
      endDate,
      isActive,
      displayText,
    });
  }

  console.log('PayPeriodUtils: Generated', periods.length, 'pay periods');
  const activePeriod = periods.find(p => p.isActive);
  console.log('PayPeriodUtils: Active period:', activePeriod?.displayText || 'None');

  return periods;
}

export function getCurrentPayPeriod(transactions: Transaction[]): PayPeriod | null {
  const periods = calculatePayPeriods(transactions);
  return periods.find(period => period.isActive) || null;
}

function formatDateShort(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}