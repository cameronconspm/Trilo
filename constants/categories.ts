import Colors from './colors';
import { Category } from '@/types/finance';

const categories: Category[] = [
  {
    id: 'income',
    name: 'Income',
    color: Colors.income,
  },
  {
    id: 'debt',
    name: 'Debt',
    color: Colors.debt,
  },
  {
    id: 'subscription',
    name: 'Subscriptions',
    color: Colors.subscription,
  },
  {
    id: 'bill',
    name: 'Bills & Utilities',
    color: Colors.bill,
  },

  {
    id: 'one_time_expense',
    name: 'One-Time Expenses',
    color: Colors.oneTimeExpense,
  },
  {
    id: 'given_expenses',
    name: 'Given Expenses',
    color: Colors.givenExpenses,
  },
  {
    id: 'savings',
    name: 'Savings',
    color: Colors.savings,
  },

];

export default categories;