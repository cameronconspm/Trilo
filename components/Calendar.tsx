import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { ChevronLeft, ChevronRight, X, DollarSign, Calendar as CalendarIcon } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { useFinance } from '@/context/FinanceContext';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import Card from '@/components/Card';
import TransactionItem from '@/components/TransactionItem';
import { Transaction, Income } from '@/types/finance';

interface CalendarProps {
  onTransactionEdit?: (transaction: Transaction) => void;
}

interface DayData {
  date: Date;
  expenseCount: number;
  isPayday: boolean;
  transactions: Transaction[];
  incomes: Income[];
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
    
    // Create array of all days in the calendar grid
    const days: (DayData | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      
      // Find transactions for this day
      const dayTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.toISOString().split('T')[0] === dateString;
      });
      
      // Find incomes for this day (paydays)
      const dayIncomes = incomes.filter(income => {
        if (!income.paySchedule) return false;
        
        // Check if this date matches any pay schedule
        const schedule = income.paySchedule;
        
        if (schedule.cadence === 'weekly') {
          const lastPaidDate = new Date(schedule.lastPaidDate);
          const daysDiff = Math.floor((date.getTime() - lastPaidDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff >= 0 && daysDiff % 7 === 0;
        } else if (schedule.cadence === 'every_2_weeks') {
          const lastPaidDate = new Date(schedule.lastPaidDate);
          const daysDiff = Math.floor((date.getTime() - lastPaidDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff >= 0 && daysDiff % 14 === 0;
        } else if (schedule.cadence === 'monthly') {
          const lastPaidDate = new Date(schedule.lastPaidDate);
          return date.getDate() === lastPaidDate.getDate();
        } else if (schedule.cadence === 'twice_monthly' && schedule.monthlyDays) {
          return schedule.monthlyDays.includes(date.getDate());
        }
        
        return false;
      });
      
      const expenseTransactions = dayTransactions.filter(t => t.type === 'expense');
      
      days.push({
        date,
        expenseCount: expenseTransactions.length,
        isPayday: dayIncomes.length > 0,
        transactions: dayTransactions,
        incomes: dayIncomes,
      });
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

  const renderDay = (dayData: DayData | null, index: number) => {
    if (!dayData) {
      return <View key={index} style={styles.emptyDay} />;
    }

    const isToday = dayData.date.toDateString() === new Date().toDateString();
    const hasActivity = dayData.expenseCount > 0 || dayData.isPayday;

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.dayCell,
          { backgroundColor: colors.card },
          isToday && { backgroundColor: colors.primary },
          hasActivity && styles.dayWithActivity,
        ]}
        onPress={() => handleDayPress(dayData)}
        activeOpacity={hasActivity ? 0.7 : 1}
        disabled={!hasActivity}
      >
        <Text style={[
          styles.dayNumber,
          { color: isToday ? colors.background : colors.text },
          !hasActivity && { color: colors.textSecondary }
        ]}>
          {dayData.date.getDate()}
        </Text>
        
        {/* Activity indicators */}
        <View style={styles.indicators}>
          {dayData.isPayday && (
            <View style={[styles.paydayIndicator, { backgroundColor: colors.success }]} />
          )}
          {dayData.expenseCount > 0 && (
            <View style={styles.expenseIndicator}>
              <Text style={[styles.expenseCount, { color: colors.error }]}>
                {dayData.expenseCount}
              </Text>
            </View>
          )}
        </View>
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
      <View style={styles.calendar}>
        {calendarData.map((dayData, index) => renderDay(dayData, index))}
      </View>

      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: colors.cardSecondary }]}>
        <View style={styles.legendItem}>
          <View style={[styles.paydayIndicator, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Payday</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.expenseIndicatorLegend, { borderColor: colors.error }]}>
            <Text style={[styles.expenseCountLegend, { color: colors.error }]}>N</Text>
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
                  {selectedDay.transactions.map((transaction, index) => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      isLast={index === selectedDay.transactions.length - 1}
                      onEdit={onTransactionEdit}
                      enableSwipeActions={true}
                    />
                  ))}
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
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadow.light,
  },
  navButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  daysHeader: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  emptyDay: {
    width: '14.28%',
    aspectRatio: 1,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayWithActivity: {
    ...Shadow.light,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  indicators: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  paydayIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  expenseIndicator: {
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  expenseCount: {
    fontSize: 8,
    fontWeight: '600',
    lineHeight: 10,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  expenseIndicatorLegend: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseCountLegend: {
    fontSize: 8,
    fontWeight: '600',
    lineHeight: 10,
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
});