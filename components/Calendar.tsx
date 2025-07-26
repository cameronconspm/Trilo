import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { ChevronLeft, ChevronRight, X, DollarSign, Calendar as CalendarIcon, Repeat, Edit3 } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { useFinance } from '@/context/FinanceContext';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import Card from '@/components/Card';
import TransactionItem from '@/components/TransactionItem';
import { Transaction, Income } from '@/types/finance';
import categories from '@/constants/categories';
import { getPayDatesInRange } from '@/utils/payScheduleUtils';

interface CalendarProps {
  onTransactionEdit?: (transaction: Transaction) => void;
}

interface CategoryIndicator {
  categoryId: string;
  color: string;
  count: number;
  isRecurring?: boolean;
}

interface DayData {
  date: Date;
  expenseCount: number;
  recurringExpenseCount: number;
  isPayday: boolean;
  transactions: Transaction[];
  recurringTransactions: Transaction[];
  incomes: Income[];
  categoryIndicators: CategoryIndicator[];
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Calendar({ onTransactionEdit }: CalendarProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const { transactions, incomes } = useFinance();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);

  // Get calendar data for current month
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    

    
    // Create array of all days in the calendar grid (6 weeks = 42 days)
    const days: (DayData | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      
      // Find one-time transactions for this day
      const dayTransactions = transactions.filter(t => {
        if (t.isRecurring) return false; // Skip recurring transactions here
        const transactionDate = new Date(t.date);
        return transactionDate.toISOString().split('T')[0] === dateString;
      });
      
      // Find recurring transactions that should appear on this day
      const recurringTransactions = transactions.filter(t => {
        if (!t.isRecurring) return false;
        
        // Handle expenses with given expense schedules
        if (t.type === 'expense' && t.givenExpenseSchedule) {
          const schedule = t.givenExpenseSchedule;
          const startDate = new Date(schedule.startDate);
          
          console.log(`Calendar: Checking recurring expense ${t.name} with schedule:`, schedule);
          
          if (schedule.frequency === 'every_week') {
            // Weekly: check if this date falls on the same day of week as start date
            const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const shouldShow = daysDiff >= 0 && daysDiff % 7 === 0;
            console.log(`  Weekly check: daysDiff=${daysDiff}, shouldShow=${shouldShow}`);
            return shouldShow;
          } else if (schedule.frequency === 'every_other_week') {
            // Bi-weekly: check if this date falls on the same day every 2 weeks
            const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const shouldShow = daysDiff >= 0 && daysDiff % 14 === 0;
            console.log(`  Bi-weekly check: daysDiff=${daysDiff}, shouldShow=${shouldShow}`);
            return shouldShow;
          } else if (schedule.frequency === 'once_a_month') {
            // Monthly: show on the same day of month as start date
            const shouldShow = date.getDate() === startDate.getDate();
            console.log(`  Monthly check: date=${date.getDate()}, startDate=${startDate.getDate()}, shouldShow=${shouldShow}`);
            return shouldShow;
          }
          return false;
        }
        
        // Handle income with pay schedules
        if (t.type === 'income' && t.paySchedule) {
          const payDates = getPayDatesInRange(t.paySchedule, date, date);
          const shouldShow = payDates.length > 0;
          console.log(`Calendar: Recurring income ${t.name} - payDates=${payDates.length}, shouldShow=${shouldShow}`);
          return shouldShow;
        }
        
        // Default recurring logic for other transactions
        const originalDate = new Date(t.date);
        const originalDay = originalDate.getDate();
        
        // Show recurring transaction on the same day of each month
        const shouldShow = date.getDate() === originalDay;
        console.log(`Calendar: Default recurring ${t.name} - originalDay=${originalDay}, currentDay=${date.getDate()}, shouldShow=${shouldShow}`);
        return shouldShow;
      });
      
      console.log(`Calendar: Day ${day} - Found ${recurringTransactions.length} recurring transactions`);
      recurringTransactions.forEach(t => {
        console.log(`  - ${t.name}: ${t.amount} (${t.type}, recurring: ${t.isRecurring})`);
      });
      
      // Combine all transactions for this day
      const allDayTransactions = [...dayTransactions, ...recurringTransactions];
      
      // Find incomes for this day (paydays)
      const dayIncomes = incomes.filter(income => {
        if (!income.isActive || !income.paySchedule) return false;
        
        // Use the utility function to get pay dates for this specific day
        const payDates = getPayDatesInRange(income.paySchedule, date, date);
        return payDates.length > 0;
      });
      
      console.log(`Calendar: Day ${day} - Found ${dayIncomes.length} income sources with pay dates`);
      dayIncomes.forEach(income => {
        console.log(`  - ${income.name}: ${income.amount} (${income.frequency})`);
      });
      

      const oneTimeExpenses = dayTransactions.filter(t => t.type === 'expense');
      const recurringExpenses = recurringTransactions.filter(t => t.type === 'expense');
      
      // Group transactions by category for indicators
      const categoryMap = new Map<string, { count: number; isRecurring: boolean; color: string }>();
      
      // Process one-time expenses
      oneTimeExpenses.forEach(transaction => {
        const category = categories.find(c => c.id === transaction.category);
        if (category) {
          const existing = categoryMap.get(category.id) || { count: 0, isRecurring: false, color: category.color };
          categoryMap.set(category.id, {
            ...existing,
            count: existing.count + 1
          });
        }
      });
      
      // Process recurring expenses
      recurringExpenses.forEach(transaction => {
        const category = categories.find(c => c.id === transaction.category);
        if (category) {
          const existing = categoryMap.get(category.id) || { count: 0, isRecurring: false, color: category.color };
          categoryMap.set(category.id, {
            ...existing,
            count: existing.count + 1,
            isRecurring: true
          });
        }
      });
      
      // Convert to array of indicators
      const categoryIndicators: CategoryIndicator[] = Array.from(categoryMap.entries()).map(([categoryId, data]) => ({
        categoryId,
        color: data.color,
        count: data.count,
        isRecurring: data.isRecurring
      }));
      
      days.push({
        date,
        expenseCount: oneTimeExpenses.length,
        recurringExpenseCount: recurringExpenses.length,
        isPayday: dayIncomes.length > 0,
        transactions: allDayTransactions,
        recurringTransactions,
        incomes: dayIncomes,
        categoryIndicators,
      });
    }
    
    // Fill remaining cells to complete the 6-week grid (42 total cells)
    const totalCells = 42;
    while (days.length < totalCells) {
      days.push(null);
    }
    
    return days;
  }, [currentDate, transactions, incomes]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDayPress = (dayData: DayData) => {
    if (dayData.transactions.length > 0 || dayData.incomes.length > 0) {
      setSelectedDay(dayData);
      setShowDayModal(true);
    }
  };
  
  const handleEditTransaction = (transaction: Transaction) => {
    setShowDayModal(false);
    if (onTransactionEdit) {
      onTransactionEdit(transaction);
    }
  };

  const renderDay = (dayData: DayData | null, index: number) => {
    if (!dayData) {
      return <View key={index} style={styles.emptyDay} />;
    }

    const isToday = dayData.date.toDateString() === new Date().toDateString();
    const hasActivity = dayData.categoryIndicators.length > 0 || dayData.isPayday || dayData.transactions.length > 0 || dayData.incomes.length > 0;
    const totalExpenses = dayData.expenseCount + dayData.recurringExpenseCount;
    const totalIncomes = dayData.incomes.length;
    const totalTransactions = dayData.transactions.length;

    console.log(`Calendar: Rendering day ${dayData.date.getDate()} - Expenses: ${totalExpenses}, Incomes: ${totalIncomes}, Transactions: ${totalTransactions}, HasActivity: ${hasActivity}`);

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.dayCell,
          { backgroundColor: colors.card },
          isToday && { backgroundColor: colors.primary, ...Shadow.medium },
          hasActivity && styles.dayWithActivity,
        ]}
        onPress={() => handleDayPress(dayData)}
        activeOpacity={hasActivity ? 0.7 : 1}
        disabled={!hasActivity}
        accessible={true}
        accessibilityLabel={`${dayData.date.getDate()}${isToday ? ' today' : ''}${dayData.isPayday ? ' payday' : ''}${totalExpenses > 0 ? ` ${totalExpenses} expenses` : ''}${totalIncomes > 0 ? ` ${totalIncomes} income sources` : ''}`}
        accessibilityRole="button"
      >
        <Text style={[
          styles.dayNumber,
          { color: isToday ? '#FFFFFF' : colors.text },
          !hasActivity && !isToday && { color: colors.textSecondary },
          isToday && styles.todayText
        ]}>
          {dayData.date.getDate()}
        </Text>
        
        {/* Expense notification bubble - top right */}
        {totalExpenses > 0 && (
          <View style={styles.notificationBubble}>
            <Text style={styles.notificationText}>{totalExpenses}</Text>
          </View>
        )}
        
        {/* Payday green line indicator - below the number */}
        {dayData.isPayday && (
          <View style={styles.paydayLine} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Month Navigation */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        
        <Text style={[styles.monthTitle, { color: colors.text }]}>
          {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
          activeOpacity={0.7}
        >
          <ChevronRight size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Days of Week Header */}
      <View style={styles.daysHeader}>
        {DAYS_OF_WEEK.map(day => (
          <Text key={day} style={[styles.dayHeaderText, { color: colors.textSecondary }]}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarContainer}>
        <View style={styles.calendar}>
          {/* Render calendar in 6 rows of 7 days each */}
          {Array.from({ length: 6 }, (_, weekIndex) => (
            <View key={weekIndex} style={styles.calendarRow}>
              {Array.from({ length: 7 }, (_, dayIndex) => {
                const cellIndex = weekIndex * 7 + dayIndex;
                return renderDay(calendarData[cellIndex] || null, cellIndex);
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: colors.cardSecondary }]}>
        <View style={styles.legendItem}>
          <View style={styles.legendPaydayLine} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Payday</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendNotificationBubble}>
            <Text style={styles.legendNotificationText}>1</Text>
          </View>
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Expenses</Text>
        </View>
      </View>

      {/* Day Detail Modal */}
      <Modal
        visible={showDayModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDayModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.card }]}>
            <View style={styles.modalTitleContainer}>
              <CalendarIcon size={24} color={colors.primary} strokeWidth={2} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedDay?.date.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDayModal(false)}
              activeOpacity={0.7}
            >
              <X size={24} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Paydays */}
            {selectedDay?.incomes && selectedDay.incomes.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Paydays</Text>
                <Card style={styles.sectionCard}>
                  {selectedDay.incomes.map((income, index) => (
                    <View key={income.id} style={[
                      styles.incomeItem,
                      index < selectedDay.incomes.length - 1 && styles.itemBorder,
                      { borderBottomColor: colors.border }
                    ]}>
                      <View style={styles.incomeInfo}>
                        <Text style={[styles.incomeName, { color: colors.text }]}>
                          {income.name}
                        </Text>
                        <Text style={[styles.incomeAmount, { color: colors.success }]}>
                          +${income.amount.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </Card>
              </>
            )}

            {/* Transactions */}
            {selectedDay?.transactions && selectedDay.transactions.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Transactions</Text>
                <Card>
                  {selectedDay.transactions.map((transaction, index) => {
                    const isRecurring = selectedDay.recurringTransactions.some(rt => rt.id === transaction.id);
                    return (
                      <View key={transaction.id} style={styles.transactionWrapper}>
                        <View style={styles.transactionHeader}>
                          {isRecurring && (
                            <View style={styles.recurringTransactionBadge}>
                              <Repeat size={12} color={colors.calendarRecurring} strokeWidth={2} />
                              <Text style={[styles.recurringBadgeText, { color: colors.calendarRecurring }]}>Recurring</Text>
                            </View>
                          )}
                          <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => handleEditTransaction(transaction)}
                            activeOpacity={0.7}
                            accessible={true}
                            accessibilityLabel={`Edit ${transaction.name}`}
                            accessibilityRole="button"
                          >
                            <Edit3 size={16} color={colors.primary} strokeWidth={2} />
                          </TouchableOpacity>
                        </View>
                        <TransactionItem
                          transaction={transaction}
                          isLast={index === selectedDay.transactions.length - 1}
                          enableSwipeActions={false}
                        />
                      </View>
                    );
                  })}
                </Card>
              </>
            )}

            {/* Empty State */}
            {(!selectedDay?.transactions || selectedDay.transactions.length === 0) && 
             (!selectedDay?.incomes || selectedDay.incomes.length === 0) && (
              <View style={styles.emptyState}>
                <DollarSign size={48} color={colors.inactive} strokeWidth={1.5} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  No financial activity on this day
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    ...Shadow.light,
  },
  navButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 22,
    textAlign: 'center',
  },
  daysHeader: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.md,
    justifyContent: 'space-between',
  },
  dayHeaderText: {
    flex: 1, // Use flex instead of fixed width
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  calendarContainer: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  calendar: {
    // Grid layout: 6 rows x 7 columns
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  emptyDay: {
    width: '14.28%', // 1/7 of the width
    aspectRatio: 1,
    marginHorizontal: 1,
  },
  dayCell: {
    width: '14.28%', // 1/7 of the width
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    marginHorizontal: 1,
    minHeight: 44,
    paddingTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dayWithActivity: {
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: -0.2,
    textAlign: 'center',
    marginBottom: 2,
  },
  todayText: {
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  notificationBubble: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1.5,
    elevation: 2,
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
    textAlign: 'center',
  },
  paydayLine: {
    width: 20,
    height: 2,
    backgroundColor: '#34C759',
    borderRadius: 1,
    marginTop: 2,
  },

  expenseIndicator: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Better contrast
  },
  expenseCount: {
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 13,
    textAlign: 'center',
  },
  recurringBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Better contrast
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xxl * 1.5,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minWidth: 70,
  },
  legendText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 16,
    textAlign: 'center',
  },
  legendPaydayLine: {
    width: 20,
    height: 2,
    backgroundColor: '#34C759',
    borderRadius: 1,
  },
  legendNotificationBubble: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1.5,
    elevation: 2,
  },
  legendNotificationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
    textAlign: 'center',
  },
  legendCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  legendCategoryCount: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    ...Shadow.light,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  closeButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
    letterSpacing: -0.1,
    lineHeight: 22,
  },
  sectionCard: {
    marginBottom: Spacing.lg,
  },
  incomeItem: {
    paddingVertical: Spacing.md,
  },
  itemBorder: {
    borderBottomWidth: 1,
  },
  incomeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incomeName: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
  },
  incomeAmount: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },

  recurringBadgeLegend: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionWrapper: {
    position: 'relative',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  recurringTransactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  recurringBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
  },
  editButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
});
