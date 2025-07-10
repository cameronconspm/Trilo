import Colors from './colors';
import { Category } from '@/types/finance';

const categories: Category[] = [
  {
    id: 'income',
    name: 'Income',
    color: Colors.income,
  },
  {
    id: 'savings',
    name: 'Savings',
    color: Colors.savings,
  },
  {
    id: 'subscriptions',
    name: 'Subscriptions',
    color: Colors.subscriptions,
  },
  {
    id: 'bills_utilities',
    name: 'Bills & Utilities',
    color: Colors.billsUtilities,
  },
  {
    id: 'debt',
    name: 'Debt',
    color: Colors.debt,
  },
  {
    id: 'wants',
    name: 'Wants',
    color: Colors.wants,
  },
  {
    id: 'needs',
    name: 'Needs',
    color: Colors.needs,
  },
  {
    id: 'miscellaneous',
    name: 'Miscellaneous',
    color: Colors.miscellaneous,
  },
];

export default categories;