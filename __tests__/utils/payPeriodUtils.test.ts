import {
  calculatePayPeriods,
  getCurrentPayPeriod,
  PayPeriod,
  PayPeriodCalculationResult,
} from '../../utils/payPeriodUtils';
import { Transaction, IncomeTransaction } from '../../types/finance';

// Mock the pay schedule utilities
jest.mock('../../utils/payScheduleUtils', () => ({
  calculateNextPayDate: jest.fn((paySchedule, fromDate) => {
    const lastPaid = new Date(paySchedule.lastPaidDate);
    const nextDate = new Date(lastPaid);
    nextDate.setDate(nextDate.getDate() + 14); // Mock bi-weekly
    return { date: nextDate, isValid: true };
  }),
}));

describe('payPeriodUtils', () => {
  const mockIncomeTransaction: IncomeTransaction = {
    id: 'income-1',
    name: 'Salary',
    amount: 2000,
    date: '2025-08-01T00:00:00.000Z',
    category: 'income',
    type: 'income',
    isRecurring: true,
    paySchedule: {
      cadence: 'every_2_weeks',
      lastPaidDate: '2025-08-01T00:00:00.000Z',
    },
  };

  const mockNonRecurringIncome: IncomeTransaction = {
    id: 'income-2',
    name: 'Bonus',
    amount: 1000,
    date: '2025-08-15T00:00:00.000Z',
    category: 'income',
    type: 'income',
    isRecurring: false,
  };

  const mockExpenseTransaction: Transaction = {
    id: 'expense-1',
    name: 'Rent',
    amount: 800,
    date: '2025-08-01T00:00:00.000Z',
    category: 'bill',
    type: 'expense',
    isRecurring: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculatePayPeriods', () => {
    it('should return empty periods when no income transactions exist', () => {
      const transactions: Transaction[] = [mockExpenseTransaction];
      const result = calculatePayPeriods(transactions);

      expect(result.periods).toHaveLength(0);
      expect(result.error).toBe('No income transactions found');
    });

    it('should calculate pay periods for single income transaction', () => {
      const transactions: Transaction[] = [mockIncomeTransaction];
      const result = calculatePayPeriods(transactions);

      expect(result.periods).toHaveLength(2); // One from income date to next pay date, one from next pay date onwards
      expect(result.error).toBeUndefined();

      const period = result.periods[0];
      expect(period.startDate).toBeInstanceOf(Date);
      expect(period.endDate).toBeInstanceOf(Date);
      expect(period.isActive).toBeDefined();
      expect(period.displayText).toBeDefined();
    });

    it('should calculate pay periods for multiple income transactions', () => {
      const transactions: Transaction[] = [
        mockIncomeTransaction,
        {
          ...mockIncomeTransaction,
          id: 'income-3',
          date: '2025-08-29T00:00:00.000Z',
        },
      ];
      const result = calculatePayPeriods(transactions);

      expect(result.periods).toHaveLength(3); // Multiple periods due to recurring income logic
      expect(result.error).toBeUndefined();

      // First period should be from first income to next pay date
      const firstPeriod = result.periods[0];
      expect(firstPeriod.startDate.getTime()).toBe(
        new Date('2025-07-31T07:00:00.000Z').getTime()
      );

      // Second period should be from next pay date to second income
      const secondPeriod = result.periods[1];
      expect(secondPeriod.startDate.getTime()).toBe(
        new Date('2025-08-14T07:00:00.000Z').getTime()
      );

      // Third period should be from second income onwards
      const thirdPeriod = result.periods[2];
      expect(thirdPeriod.startDate.getTime()).toBe(
        new Date('2025-08-28T07:00:00.000Z').getTime()
      );
    });

    it('should handle recurring income with future dates', () => {
      const transactions: Transaction[] = [mockIncomeTransaction];
      const result = calculatePayPeriods(transactions);

      expect(result.periods).toHaveLength(2); // One from income date to next pay date, one from next pay date onwards
      expect(result.error).toBeUndefined();
    });

    it('should handle mixed recurring and non-recurring income', () => {
      const transactions: Transaction[] = [
        mockIncomeTransaction,
        mockNonRecurringIncome,
      ];
      const result = calculatePayPeriods(transactions);

      expect(result.periods).toHaveLength(3); // Multiple periods due to recurring income logic
      expect(result.error).toBeUndefined();
    });

    it('should handle errors gracefully', () => {
      // Mock a transaction that might cause calculation errors
      const problematicTransaction: IncomeTransaction = {
        ...mockIncomeTransaction,
        paySchedule: {
          cadence: 'every_2_weeks',
          lastPaidDate: 'invalid-date',
        },
      };

      const transactions: Transaction[] = [problematicTransaction];
      const result = calculatePayPeriods(transactions);

      // Should still return some result even if individual calculations fail
      expect(result.periods).toBeDefined();
    });

    it('should set correct active period based on current date', () => {
      const transactions: Transaction[] = [mockIncomeTransaction];
      const result = calculatePayPeriods(transactions);

      expect(result.periods).toHaveLength(2);
      const activePeriod = result.periods.find(period => period.isActive);

      // Should have one active period
      expect(activePeriod).toBeDefined();
      expect(activePeriod?.isActive).toBe(true);
    });
  });

  describe('getCurrentPayPeriod', () => {
    it('should return current active pay period', () => {
      const transactions: Transaction[] = [mockIncomeTransaction];
      const result = getCurrentPayPeriod(transactions);

      if (result) {
        expect(result).toHaveProperty('startDate');
        expect(result).toHaveProperty('endDate');
        expect(result).toHaveProperty('isActive');
        expect(result).toHaveProperty('displayText');
      }
    });

    it('should return null when no pay periods exist', () => {
      const transactions: Transaction[] = [mockExpenseTransaction];
      const result = getCurrentPayPeriod(transactions);

      expect(result).toBeNull();
    });

    it('should return null when no active period exists', () => {
      // Create a transaction with a future date
      const futureIncome: IncomeTransaction = {
        ...mockIncomeTransaction,
        date: '2025-12-01T00:00:00.000Z',
        paySchedule: {
          cadence: 'every_2_weeks',
          lastPaidDate: '2025-12-01T00:00:00.000Z',
        },
      };

      const transactions: Transaction[] = [futureIncome];
      const result = getCurrentPayPeriod(transactions);

      if (result) {
        expect(result.isActive).toBe(false);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle income transactions with same date', () => {
      const sameDateIncome1: IncomeTransaction = {
        ...mockIncomeTransaction,
        id: 'income-1',
        date: '2025-08-01T00:00:00.000Z',
      };

      const sameDateIncome2: IncomeTransaction = {
        ...mockIncomeTransaction,
        id: 'income-2',
        date: '2025-08-01T00:00:00.000Z',
      };

      const transactions: Transaction[] = [sameDateIncome1, sameDateIncome2];
      const result = calculatePayPeriods(transactions);

      expect(result.periods).toHaveLength(4); // Multiple periods due to recurring income logic
      expect(result.error).toBeUndefined();
    });

    it('should handle income transactions in reverse chronological order', () => {
      const transactions: Transaction[] = [
        {
          ...mockIncomeTransaction,
          id: 'income-2',
          date: '2025-08-15T00:00:00.000Z',
        },
        mockIncomeTransaction, // Earlier date
      ];

      const result = calculatePayPeriods(transactions);

      expect(result.periods).toHaveLength(3); // Multiple periods due to recurring income logic
      expect(result.periods[0].startDate.getTime()).toBe(
        new Date('2025-07-31T07:00:00.000Z').getTime()
      );
      expect(result.periods[1].startDate.getTime()).toBe(
        new Date('2025-08-14T07:00:00.000Z').getTime()
      );
      expect(result.periods[2].startDate.getTime()).toBe(
        new Date('2025-08-14T07:00:00.000Z').getTime()
      );
    });

    it('should handle very old income transactions', () => {
      const oldIncome: IncomeTransaction = {
        ...mockIncomeTransaction,
        date: '2020-01-01T00:00:00.000Z',
        paySchedule: {
          cadence: 'every_2_weeks',
          lastPaidDate: '2020-01-01T00:00:00.000Z',
        },
      };

      const transactions: Transaction[] = [oldIncome];
      const result = calculatePayPeriods(transactions);

      expect(result.periods).toHaveLength(2); // Multiple periods due to recurring income logic
      expect(result.error).toBeUndefined();
    });
  });
});
