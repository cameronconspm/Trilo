import { Transaction } from '@/types/finance';

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
    return [];
  }

  const periods: PayPeriod[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time for accurate comparison

  for (let i = 0; i < incomeTransactions.length; i++) {
    const currentIncome = incomeTransactions[i];
    const nextIncome = incomeTransactions[i + 1];
    
    const startDate = new Date(currentIncome.date);
    startDate.setHours(0, 0, 0, 0);
    
    let endDate: Date;
    let displayText: string;
    
    if (nextIncome) {
      // End the day before the next income
      endDate = new Date(nextIncome.date);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      
      displayText = `${formatDateShort(startDate)} ${formatDateShort(endDate)}`;
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
    
    periods.push({
      startDate,
      endDate,
      isActive,
      displayText,
    });
  }

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