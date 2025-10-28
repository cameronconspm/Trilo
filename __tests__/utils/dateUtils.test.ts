import {
  getDateFromWeekAndDay,
  getWeekOfMonth,
  getDayOfWeekString,
  calculateIncomeDate,
  DateCalculationResult,
  isLeapYear,
  getDaysInMonth,
  getFirstWeekday,
  getLeadingBlanks,
  generateCalendarGrid,
} from '../../utils/dateUtils';
import { WeekDay, WeekNumber } from '../../types/finance';

describe('dateUtils', () => {
  describe('getDateFromWeekAndDay', () => {
    it('should calculate correct date for valid inputs', () => {
      const result = getDateFromWeekAndDay(2025, 7, 1, 'friday'); // August 1st, 2025

      expect(result.isValid).toBe(true);
      expect(result.date.getFullYear()).toBe(2025);
      expect(result.date.getMonth()).toBe(7); // August
      expect(result.date.getDate()).toBe(1);
      expect(result.date.getDay()).toBe(5); // Friday
    });

    it('should handle first week of month correctly', () => {
      const result = getDateFromWeekAndDay(2025, 7, 1, 'sunday'); // August 3rd, 2025

      expect(result.isValid).toBe(true);
      expect(result.date.getDate()).toBe(3);
      expect(result.date.getDay()).toBe(0); // Sunday
    });

    it('should handle last week of month correctly', () => {
      const result = getDateFromWeekAndDay(2025, 7, 5, 'saturday'); // August 30th, 2025

      expect(result.isValid).toBe(true);
      expect(result.date.getDate()).toBe(30);
      expect(result.date.getDay()).toBe(6); // Saturday
    });

    it('should return error for invalid year', () => {
      const result = getDateFromWeekAndDay(1800, 7, 1, 'friday');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid year');
    });

    it('should return error for invalid month', () => {
      const result = getDateFromWeekAndDay(2025, 12, 1, 'friday');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid month');
    });

    it('should return error for invalid week number', () => {
      const result = getDateFromWeekAndDay(2025, 7, 6 as any, 'friday');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid week number');
    });

    it('should handle edge case when date goes into next month', () => {
      const result = getDateFromWeekAndDay(2025, 7, 5, 'friday'); // August 29th, 2025

      expect(result.isValid).toBe(true);
      expect(result.date.getMonth()).toBe(7); // Should still be August
    });
  });

  describe('getWeekOfMonth', () => {
    it('should return correct week number for first week', () => {
      const date = new Date(2025, 7, 1); // August 1st, 2025 (Friday)
      const weekNumber = getWeekOfMonth(date);

      expect(weekNumber).toBe(1);
    });

    it('should return correct week number for middle week', () => {
      const date = new Date(2025, 7, 15); // August 15th, 2025
      const weekNumber = getWeekOfMonth(date);

      expect(weekNumber).toBe(3);
    });

    it('should return correct week number for last week', () => {
      const date = new Date(2025, 7, 31); // August 31st, 2025
      const weekNumber = getWeekOfMonth(date);

      expect(weekNumber).toBe(5);
    });

    it('should handle edge case at month boundary', () => {
      const date = new Date(2025, 7, 7); // August 7th, 2025
      const weekNumber = getWeekOfMonth(date);

      expect(weekNumber).toBe(2);
    });

    it('should return week 1 as fallback on error', () => {
      // Mock a date that might cause issues
      const mockDate = new Date('invalid-date');
      const weekNumber = getWeekOfMonth(mockDate);

      expect(weekNumber).toBe(1);
    });
  });

  describe('getDayOfWeekString', () => {
    it('should return correct day string for each day', () => {
      const testCases: Array<{ date: Date; expected: WeekDay }> = [
        { date: new Date(2025, 7, 1), expected: 'friday' }, // Friday
        { date: new Date(2025, 7, 2), expected: 'saturday' }, // Saturday
        { date: new Date(2025, 7, 3), expected: 'sunday' }, // Sunday
        { date: new Date(2025, 7, 4), expected: 'monday' }, // Monday
        { date: new Date(2025, 7, 5), expected: 'tuesday' }, // Tuesday
        { date: new Date(2025, 7, 6), expected: 'wednesday' }, // Wednesday
        { date: new Date(2025, 7, 7), expected: 'thursday' }, // Thursday
      ];

      testCases.forEach(({ date, expected }) => {
        const result = getDayOfWeekString(date);
        expect(result).toBe(expected);
      });
    });

    it('should return sunday as fallback on error', () => {
      // Mock a date that might cause issues
      const mockDate = new Date('invalid-date');
      const result = getDayOfWeekString(mockDate);

      expect(result).toBe('sunday');
    });
  });

  describe('calculateIncomeDate', () => {
    it('should calculate correct income date for valid inputs', () => {
      const referenceDate = new Date(2025, 7, 15); // August 15th, 2025
      const result = calculateIncomeDate(1, 'friday', referenceDate);

      expect(result).toBeDefined();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should use current date as default reference', () => {
      const result = calculateIncomeDate(1, 'friday');

      expect(result).toBeDefined();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should handle invalid date calculation gracefully', () => {
      // This test verifies that the function handles edge cases gracefully
      const result = calculateIncomeDate(5, 'friday', new Date(2025, 7, 1));

      expect(result).toBeDefined();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should return fallback date on calculation error', () => {
      // Mock a reference date that might cause issues
      const mockReferenceDate = new Date('invalid-date');
      const result = calculateIncomeDate(1, 'friday', mockReferenceDate);

      expect(result).toBeDefined();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle leap year correctly', () => {
      const result = getDateFromWeekAndDay(2024, 1, 5, 'thursday'); // February 29th, 2024

      expect(result.isValid).toBe(true);
      expect(result.date.getFullYear()).toBe(2024);
      expect(result.date.getMonth()).toBe(1); // February
      expect(result.date.getDate()).toBe(29);
    });

    it('should handle month with 31 days correctly', () => {
      const result = getDateFromWeekAndDay(2025, 7, 5, 'sunday'); // August 31st, 2025

      expect(result.isValid).toBe(true);
      expect(result.date.getMonth()).toBe(7); // August
      expect(result.date.getDate()).toBe(31);
    });

    it('should handle month with 30 days correctly', () => {
      const result = getDateFromWeekAndDay(2025, 8, 5, 'sunday'); // September 28th, 2025

      expect(result.isValid).toBe(true);
      expect(result.date.getMonth()).toBe(8); // September
      expect(result.date.getDate()).toBe(28);
    });
  });
});

describe('Calendar Date Utilities', () => {
  describe('isLeapYear', () => {
    it('should return true for leap years', () => {
      expect(isLeapYear(2000)).toBe(true); // Century leap year
      expect(isLeapYear(2004)).toBe(true); // Regular leap year
      expect(isLeapYear(2008)).toBe(true); // Regular leap year
      expect(isLeapYear(2012)).toBe(true); // Regular leap year
      expect(isLeapYear(2016)).toBe(true); // Regular leap year
      expect(isLeapYear(2020)).toBe(true); // Regular leap year
      expect(isLeapYear(2024)).toBe(true); // Regular leap year
      expect(isLeapYear(2028)).toBe(true); // Regular leap year
    });

    it('should return false for non-leap years', () => {
      expect(isLeapYear(1900)).toBe(false); // Century non-leap year
      expect(isLeapYear(2001)).toBe(false); // Regular non-leap year
      expect(isLeapYear(2002)).toBe(false); // Regular non-leap year
      expect(isLeapYear(2003)).toBe(false); // Regular non-leap year
      expect(isLeapYear(2005)).toBe(false); // Regular non-leap year
      expect(isLeapYear(2006)).toBe(false); // Regular non-leap year
      expect(isLeapYear(2007)).toBe(false); // Regular non-leap year
      expect(isLeapYear(2009)).toBe(false); // Regular non-leap year
    });
  });

  describe('getDaysInMonth', () => {
    it('should return correct days for regular months', () => {
      expect(getDaysInMonth(2024, 0)).toBe(31); // January
      expect(getDaysInMonth(2024, 2)).toBe(31); // March
      expect(getDaysInMonth(2024, 3)).toBe(30); // April
      expect(getDaysInMonth(2024, 4)).toBe(31); // May
      expect(getDaysInMonth(2024, 5)).toBe(30); // June
      expect(getDaysInMonth(2024, 6)).toBe(31); // July
      expect(getDaysInMonth(2024, 7)).toBe(31); // August
      expect(getDaysInMonth(2024, 8)).toBe(30); // September
      expect(getDaysInMonth(2024, 9)).toBe(31); // October
      expect(getDaysInMonth(2024, 10)).toBe(30); // November
      expect(getDaysInMonth(2024, 11)).toBe(31); // December
    });

    it('should handle February leap years correctly', () => {
      expect(getDaysInMonth(2024, 1)).toBe(29); // February 2024 (leap year)
      expect(getDaysInMonth(2028, 1)).toBe(29); // February 2028 (leap year)
      expect(getDaysInMonth(2000, 1)).toBe(29); // February 2000 (century leap year)
    });

    it('should handle February non-leap years correctly', () => {
      expect(getDaysInMonth(2023, 1)).toBe(28); // February 2023 (non-leap year)
      expect(getDaysInMonth(2025, 1)).toBe(28); // February 2025 (non-leap year)
      expect(getDaysInMonth(1900, 1)).toBe(28); // February 1900 (century non-leap year)
    });
  });

  describe('getFirstWeekday', () => {
    it('should return correct first weekday for known dates', () => {
      // January 2024 starts on Monday (1)
      expect(getFirstWeekday(2024, 0)).toBe(1);
      
      // February 2024 starts on Thursday (4)
      expect(getFirstWeekday(2024, 1)).toBe(4);
      
      // March 2024 starts on Friday (5)
      expect(getFirstWeekday(2024, 2)).toBe(5);
    });
  });

  describe('getLeadingBlanks', () => {
    it('should calculate correct leading blanks for Sunday start', () => {
      // Sunday = 0, Monday = 1, etc.
      expect(getLeadingBlanks(0, 0)).toBe(0); // Month starts Sunday, week starts Sunday
      expect(getLeadingBlanks(1, 0)).toBe(1); // Month starts Monday, week starts Sunday
      expect(getLeadingBlanks(2, 0)).toBe(2); // Month starts Tuesday, week starts Sunday
      expect(getLeadingBlanks(3, 0)).toBe(3); // Month starts Wednesday, week starts Sunday
      expect(getLeadingBlanks(4, 0)).toBe(4); // Month starts Thursday, week starts Sunday
      expect(getLeadingBlanks(5, 0)).toBe(5); // Month starts Friday, week starts Sunday
      expect(getLeadingBlanks(6, 0)).toBe(6); // Month starts Saturday, week starts Sunday
    });

    it('should calculate correct leading blanks for Monday start', () => {
      // Monday = 1, Tuesday = 2, etc.
      expect(getLeadingBlanks(0, 1)).toBe(6); // Month starts Sunday, week starts Monday
      expect(getLeadingBlanks(1, 1)).toBe(0); // Month starts Monday, week starts Monday
      expect(getLeadingBlanks(2, 1)).toBe(1); // Month starts Tuesday, week starts Monday
      expect(getLeadingBlanks(3, 1)).toBe(2); // Month starts Wednesday, week starts Monday
      expect(getLeadingBlanks(4, 1)).toBe(3); // Month starts Thursday, week starts Monday
      expect(getLeadingBlanks(5, 1)).toBe(4); // Month starts Friday, week starts Monday
      expect(getLeadingBlanks(6, 1)).toBe(5); // Month starts Saturday, week starts Monday
    });
  });

  describe('generateCalendarGrid', () => {
    it('should generate correct grid for January 2024 (Monday start)', () => {
      const grid = generateCalendarGrid(2024, 0, 1); // January 2024, Monday start
      
      // January 2024 starts on Monday, so we need 0 leading blanks
      // January has 31 days
      // Total cells should be multiple of 7
      expect(grid.length).toBe(35); // 5 weeks * 7 days
      
      // Since January 2024 starts on Monday and week starts on Monday,
      // there are no leading blanks, so the first cell is January 1st
      expect(grid[0].isCurrentMonth).toBe(true);
      expect(grid[0].isOtherMonth).toBe(false);
      expect(grid[0].day).toBe(1);
      
      // Check current month days
      const currentMonthDays = grid.filter(day => day.isCurrentMonth);
      expect(currentMonthDays.length).toBe(31);
      expect(currentMonthDays[0].day).toBe(1);
      expect(currentMonthDays[30].day).toBe(31);
      
      // Check last few days (next month overflow)
      expect(grid[grid.length - 1].isOtherMonth).toBe(true);
      expect(grid[grid.length - 1].isCurrentMonth).toBe(false);
    });

    it('should generate correct grid for February 2024 (Sunday start)', () => {
      const grid = generateCalendarGrid(2024, 1, 0); // February 2024, Sunday start
      
      // February 2024 starts on Thursday, so we need 4 leading blanks
      // February 2024 has 29 days (leap year)
      // Total cells should be multiple of 7
      expect(grid.length).toBe(35); // 5 weeks * 7 days
      
      // Check leading blanks
      const leadingBlanks = grid.filter((day, index) => index < 4);
      expect(leadingBlanks.every(day => day.isOtherMonth)).toBe(true);
      
      // Check current month days
      const currentMonthDays = grid.filter(day => day.isCurrentMonth);
      expect(currentMonthDays.length).toBe(29);
      expect(currentMonthDays[0].day).toBe(1);
      expect(currentMonthDays[28].day).toBe(29);
    });

    it('should generate correct grid for August 2025 (Sunday start)', () => {
      const grid = generateCalendarGrid(2025, 7, 0); // August 2025, Sunday start
      
      // August 1, 2025 is a Friday (getDay() = 5)
      // For Sunday start (weekStart = 0), we need 5 leading blanks
      // First row should be: [_, _, _, _, _, 1, 2]
      // August has 31 days
      // Total: 5 + 31 = 36 cells, which needs 6 weeks (42 cells)
      expect(grid.length).toBe(42); // 6 weeks * 7 days
      
      // Check leading blanks - should be 5
      const leadingBlanks = grid.filter((day, index) => index < 5);
      expect(leadingBlanks.every(day => day.isOtherMonth)).toBe(true);
      expect(leadingBlanks.length).toBe(5);
      
      // Check first current month day - should be at index 5 (6th position)
      expect(grid[5].isCurrentMonth).toBe(true);
      expect(grid[5].isOtherMonth).toBe(false);
      expect(grid[5].day).toBe(1);
      
      // Check current month days
      const currentMonthDays = grid.filter(day => day.isCurrentMonth);
      expect(currentMonthDays.length).toBe(31);
      expect(currentMonthDays[0].day).toBe(1);
      expect(currentMonthDays[30].day).toBe(31);
    });

    it('should generate correct grid for August 2025 (Monday start)', () => {
      const grid = generateCalendarGrid(2025, 7, 1); // August 2025, Monday start
      
      // August 1, 2025 is a Friday (getDay() = 5)
      // For Monday start (weekStart = 1), we need (5 - 1 + 7) % 7 = 4 leading blanks
      // First row should be: [_, _, _, _, 1, 2, 3]
      // August has 31 days
      expect(grid.length).toBe(35); // 5 weeks * 7 days
      
      // Check leading blanks - should be 4
      const leadingBlanks = grid.filter((day, index) => index < 4);
      expect(leadingBlanks.every(day => day.isOtherMonth)).toBe(true);
      expect(leadingBlanks.length).toBe(4);
      
      // Check first current month day - should be at index 4 (5th position)
      expect(grid[4].isCurrentMonth).toBe(true);
      expect(grid[4].isOtherMonth).toBe(false);
      expect(grid[4].day).toBe(1);
      
      // Check current month days
      const currentMonthDays = grid.filter(day => day.isCurrentMonth);
      expect(currentMonthDays.length).toBe(31);
      expect(currentMonthDays[0].day).toBe(1);
      expect(currentMonthDays[30].day).toBe(31);
    });

    it('should handle year boundaries correctly', () => {
      // December 2023 to January 2024
      const decGrid = generateCalendarGrid(2023, 11, 0); // December 2023
      const janGrid = generateCalendarGrid(2024, 0, 0); // January 2024
      
      // December 2023 starts on Friday (5), so with Sunday start (0), we need 5 leading blanks
      // 5 + 31 = 36, which rounds up to 42 (6 weeks) to maintain complete weeks
      expect(decGrid.length).toBe(42); // 6 weeks
      expect(janGrid.length).toBe(35); // 5 weeks
      
      // December 2023 has 31 days
      const decCurrentMonthDays = decGrid.filter(day => day.isCurrentMonth);
      expect(decCurrentMonthDays.length).toBe(31);
      
      // January 2024 has 31 days
      const janCurrentMonthDays = janGrid.filter(day => day.isCurrentMonth);
      expect(janCurrentMonthDays.length).toBe(31);
    });

    it('should handle February non-leap year correctly', () => {
      const grid = generateCalendarGrid(2023, 1, 0); // February 2023, Sunday start
      
      // February 2023 has 28 days
      const currentMonthDays = grid.filter(day => day.isCurrentMonth);
      expect(currentMonthDays.length).toBe(28);
      
      // Total grid should be 28 days + leading blanks + trailing blanks = multiple of 7
      expect(grid.length % 7).toBe(0);
    });
  });
});
