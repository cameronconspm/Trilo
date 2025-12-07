import { NativeModules, Platform } from 'react-native';
import { Transaction } from '@/types/finance';
import { getCategoryColor } from '@/constants/categories';

const MAX_WIDGET_ITEMS = 5;
const WIDGET_KIND = 'UpcomingExpensesWidget';
const STORAGE_VERSION = 1;

type UpcomingExpensesBridgeModule = {
  setUpcomingExpenses: (payload: string) => Promise<void>;
  clearUpcomingExpenses: () => Promise<void>;
};

const { UpcomingExpensesWidgetBridge } = NativeModules as {
  UpcomingExpensesWidgetBridge?: UpcomingExpensesBridgeModule;
};

interface WidgetExpensePayload {
  schema_version: number;
  last_updated: string;
  expenses: WidgetExpense[];
}

interface WidgetExpense {
  id: string;
  title: string;
  amount: number;
  due_date: string;
  category_color?: string;
}

let lastSerializedPayload: string | null = null;

const isBridgeAvailable = (): UpcomingExpensesBridgeModule | null => {
  if (Platform.OS !== 'ios') {
    return null;
  }
  return UpcomingExpensesWidgetBridge ?? null;
};

const buildWidgetPayload = (expenses: Transaction[]): WidgetExpensePayload | null => {
  if (!expenses || expenses.length === 0) {
    return {
      schema_version: STORAGE_VERSION,
      last_updated: new Date().toISOString(),
      expenses: [],
    };
  }

  const normalizedExpenses = expenses
    .map(expense => {
      const dueDate = new Date(expense.date);
      if (Number.isNaN(dueDate.getTime())) {
        return null;
      }

      return {
        id: expense.id,
        title: expense.name,
        amount: Number.isFinite(expense.amount) ? expense.amount : 0,
        due_date: dueDate.toISOString(),
        category_color: getCategoryColor(expense.category),
      } satisfies WidgetExpense;
    })
    .filter((value): value is WidgetExpense => value !== null)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, MAX_WIDGET_ITEMS);

  return {
    schema_version: STORAGE_VERSION,
    last_updated: new Date().toISOString(),
    expenses: normalizedExpenses,
  };
};

const serializePayload = (payload: WidgetExpensePayload): string => {
  return JSON.stringify({
    schema_version: payload.schema_version,
    last_updated: payload.last_updated,
    expenses: payload.expenses.map(expense => ({
      id: expense.id,
      title: expense.title,
      amount: expense.amount,
      due_date: expense.due_date,
      category_color: expense.category_color,
    })),
  });
};

export const WidgetSyncService = {
  async updateUpcomingExpenses(expenses: Transaction[]): Promise<void> {
    const bridge = isBridgeAvailable();
    if (!bridge) {
      return;
    }

    const payload = buildWidgetPayload(expenses);
    if (!payload) {
      return;
    }

    const serialized = serializePayload(payload);
    if (serialized === lastSerializedPayload) {
      return;
    }

    try {
      await bridge.setUpcomingExpenses(serialized);
      lastSerializedPayload = serialized;
    } catch (error) {
      // Reset cache so we retry on next attempt
      lastSerializedPayload = null;
      throw error;
    }
  },

  async clearUpcomingExpenses(): Promise<void> {
    const bridge = isBridgeAvailable();
    if (!bridge) {
      return;
    }

    lastSerializedPayload = null;
    await bridge.clearUpcomingExpenses();
  },

  invalidateCache(): void {
    lastSerializedPayload = null;
  },

  getWidgetKind(): string {
    return WIDGET_KIND;
  },
};

