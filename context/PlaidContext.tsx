import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface BankAccount {
  id: string;
  user_id: string;
  item_id: string;
  access_token: string;
  account_id: string;
  name: string;
  type: string;
  subtype?: string;
  institution_id: string;
  institution_name?: string;
  current_balance: number;
  available_balance: number;
  currency_code: string;
  mask: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  transaction_id: string;
  amount: number;
  date: string;
  name: string;
  merchant_name?: string;
  category?: string;
  subcategory?: string;
  account_owner?: string;
  pending: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlaidLinkMetadata {
  institution?: {
    name: string;
    institution_id: string;
  };
  accounts?: Array<{
    id: string;
    name: string;
    type: string;
    subtype?: string;
    mask: string;
  }>;
}

export interface PlaidState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  lastSyncTime: Date | null;
  
  // Data
  accounts: BankAccount[];
  transactions: Transaction[];
  
  // Link token
  linkToken: string | null;
  
  // UI state
  showBalances: boolean;
  isFirstTime: boolean;
  
  // Computed properties
  totalBalance: number;
  hasAccounts: boolean;
}

export type PlaidAction =
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_CONNECTION_ERROR'; payload: string | null }
  | { type: 'SET_LINK_TOKEN'; payload: string }
  | { type: 'SET_ACCOUNTS'; payload: BankAccount[] }
  | { type: 'ADD_ACCOUNT'; payload: BankAccount }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_LAST_SYNC'; payload: Date }
  | { type: 'SET_SHOW_BALANCES'; payload: boolean }
  | { type: 'SET_FIRST_TIME'; payload: boolean }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: PlaidState = {
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  lastSyncTime: null,
  accounts: [],
  transactions: [],
  linkToken: null,
  showBalances: true,
  isFirstTime: true,
  totalBalance: 0,
  hasAccounts: false,
};

// Reducer
function plaidReducer(state: PlaidState, action: PlaidAction): PlaidState {
  switch (action.type) {
    case 'SET_CONNECTING':
      return {
        ...state,
        isConnecting: action.payload,
        connectionError: action.payload ? state.connectionError : null,
      };
    
    case 'SET_CONNECTION_ERROR':
      return {
        ...state,
        connectionError: action.payload,
        isConnecting: false,
      };
    
    case 'SET_LINK_TOKEN':
      return {
        ...state,
        linkToken: action.payload,
      };
    
    case 'SET_ACCOUNTS':
      return {
        ...state,
        accounts: action.payload,
        isConnected: action.payload.length > 0,
        isConnecting: false,
        connectionError: null,
        hasAccounts: action.payload.length > 0,
        totalBalance: action.payload.reduce((sum, account) => sum + (account.current_balance || 0), 0),
      };
    
    case 'ADD_ACCOUNT':
      const newAccounts = [...state.accounts, action.payload];
      return {
        ...state,
        accounts: newAccounts,
        isConnected: true,
        isConnecting: false,
        connectionError: null,
        hasAccounts: true,
        totalBalance: newAccounts.reduce((sum, account) => sum + (account.current_balance || 0), 0),
      };
    
    case 'SET_TRANSACTIONS':
      return {
        ...state,
        transactions: action.payload,
      };
    
    case 'SET_LAST_SYNC':
      return {
        ...state,
        lastSyncTime: action.payload,
      };
    
    case 'SET_SHOW_BALANCES':
      return {
        ...state,
        showBalances: action.payload,
      };
    
    case 'SET_FIRST_TIME':
      return {
        ...state,
        isFirstTime: action.payload,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        connectionError: null,
      };
    
    case 'RESET_STATE':
      return {
        ...initialState,
        showBalances: state.showBalances, // Preserve user preference
        totalBalance: 0,
        hasAccounts: false,
      };
    
    default:
      return state;
  }
}

// Context
interface PlaidContextType {
  state: PlaidState;
  dispatch: React.Dispatch<PlaidAction>;
  
  // Actions
  connectBank: () => Promise<void>;
  disconnectBank: (accountId: string) => Promise<void>;
  refreshData: () => Promise<void>;
  toggleBalances: () => void;
  clearError: () => void;
  handlePlaidSuccess: (publicToken: string, metadata: any) => Promise<void>;
  handlePlaidExit: (error: any) => void;
  
  // Computed values
  totalBalance: number;
  hasAccounts: boolean;
  isLoading: boolean;
}

const PlaidContext = createContext<PlaidContextType | undefined>(undefined);

// Storage keys
// Helper to get user-specific storage keys
const getStorageKeys = (userId: string) => ({
  ACCOUNTS: `plaid_accounts_${userId}`,
  TRANSACTIONS: `plaid_transactions_${userId}`,
  LAST_SYNC: `plaid_last_sync_${userId}`,
  SHOW_BALANCES: `plaid_show_balances_${userId}`,
  FIRST_TIME: `plaid_first_time_${userId}`,
});

// API Base URL - Use local backend for development
// For physical devices, replace with your actual backend URL or Railway URL
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3001/api/plaid'  // Works in simulator only
  : 'https://your-backend.railway.app/api/plaid';  // Your Railway backend URL

// Provider component
interface PlaidProviderProps {
  children: React.ReactNode;
  userId: string;
}

export function PlaidProvider({ children, userId }: PlaidProviderProps) {
  const [state, dispatch] = useReducer(plaidReducer, initialState);

  // Get user-specific storage keys for this component instance
  const storageKeys = getStorageKeys(userId);

  // Load persisted state on mount
  useEffect(() => {
    loadPersistedState();
  }, [loadPersistedState, userId]); // Reload when user changes

  // Automatic sync every 15 minutes
  useEffect(() => {
    if (!state.hasAccounts) return;

    const syncInterval = setInterval(async () => {
      try {
        console.log('Auto-syncing bank data...');
        await refreshData();
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }, 15 * 60 * 1000); // 15 minutes

    // Cleanup interval on unmount or when accounts change
    return () => clearInterval(syncInterval);
  }, [state.hasAccounts]);

  // Load persisted state from AsyncStorage
  const loadPersistedState = useCallback(async () => {
    try {
      const storageKeys = getStorageKeys(userId);
      const [accounts, transactions, lastSync, showBalances, isFirstTime] = await Promise.all([
        AsyncStorage.getItem(storageKeys.ACCOUNTS),
        AsyncStorage.getItem(storageKeys.TRANSACTIONS),
        AsyncStorage.getItem(storageKeys.LAST_SYNC),
        AsyncStorage.getItem(storageKeys.SHOW_BALANCES),
        AsyncStorage.getItem(storageKeys.FIRST_TIME),
      ]);

      if (accounts) {
        const parsedAccounts = JSON.parse(accounts);
        dispatch({ type: 'SET_ACCOUNTS', payload: parsedAccounts });
      }

      if (transactions) {
        const parsedTransactions = JSON.parse(transactions);
        dispatch({ type: 'SET_TRANSACTIONS', payload: parsedTransactions });
      }

      if (lastSync) {
        dispatch({ type: 'SET_LAST_SYNC', payload: new Date(lastSync) });
      }

      if (showBalances !== null) {
        dispatch({ type: 'SET_SHOW_BALANCES', payload: JSON.parse(showBalances) });
      }

      if (isFirstTime !== null) {
        dispatch({ type: 'SET_FIRST_TIME', payload: JSON.parse(isFirstTime) });
      }
    } catch (error) {
      console.error('Error loading persisted state:', error);
    }
  }, [userId]);

  // Persist state to AsyncStorage
  const persistState = useCallback(async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error persisting ${key}:`, error);
    }
  }, []);

  // API functions
  const createLinkToken = async (): Promise<string> => {
    try {
      const response = await fetch(`${API_BASE_URL}/link/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create link token');
      }
      
      const data = await response.json();
      return data.link_token;
    } catch (error) {
      console.error('Error creating link token:', error);
      throw error;
    }
  };

  const fetchAccounts = async (): Promise<BankAccount[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/accounts/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      
      const accounts = await response.json();
      return accounts;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  };

  const fetchTransactions = async (): Promise<Transaction[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/${userId}?limit=50`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const transactions = await response.json();
      return transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  };

  const exchangePublicToken = async (publicToken: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/link/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_token: publicToken,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Exchange failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Token exchange successful:', data);
    } catch (error) {
      console.error('❌ Token exchange failed:', error);
      throw error;
    }
  };

  // Actions
  const connectBank = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_CONNECTING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // Get link token
      const token = await createLinkToken();
      dispatch({ type: 'SET_LINK_TOKEN', payload: token });

      // The actual Plaid Link will be handled by the PlaidLink component
      // This function just prepares the state
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'SET_CONNECTION_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const handlePlaidSuccess = async (publicToken: string, metadata: PlaidLinkMetadata): Promise<void> => {
    try {
      console.log('🔄 Processing successful Plaid connection...');
      
      // Exchange public token for access token
      await exchangePublicToken(publicToken);
      
      // Fetch updated accounts and transactions
      const [accounts, transactions] = await Promise.all([
        fetchAccounts(),
        fetchTransactions(),
      ]);
      
      // Update state
      dispatch({ type: 'SET_ACCOUNTS', payload: accounts });
      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
      dispatch({ type: 'SET_FIRST_TIME', payload: false });
      
      // Persist to storage
      await Promise.all([
        persistState(storageKeys.ACCOUNTS, accounts),
        persistState(storageKeys.TRANSACTIONS, transactions),
        persistState(storageKeys.LAST_SYNC, new Date().toISOString()),
        persistState(storageKeys.FIRST_TIME, false),
      ]);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'SET_CONNECTION_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const handlePlaidExit = (error: any): void => {
    console.log('🚪 Plaid Link exited:', error);
    dispatch({ type: 'SET_CONNECTING', payload: false });
    
    if (error) {
      const errorMessage = error.error_message || 'Connection was cancelled';
      dispatch({ type: 'SET_CONNECTION_ERROR', payload: errorMessage });
    }
  };

  const disconnectBank = async (accountId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/accounts/${accountId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect account');
      }

      // Remove account from state
      const updatedAccounts = state.accounts.filter(account => account.id !== accountId);
      dispatch({ type: 'SET_ACCOUNTS', payload: updatedAccounts });
      
      // Persist updated accounts
      await persistState(storageKeys.ACCOUNTS, updatedAccounts);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'SET_CONNECTION_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const refreshData = async (): Promise<void> => {
    try {
      if (state.accounts.length === 0) return;

      const [accounts, transactions] = await Promise.all([
        fetchAccounts(),
        fetchTransactions(),
      ]);
      
      dispatch({ type: 'SET_ACCOUNTS', payload: accounts });
      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
      
      // Persist to storage
      await Promise.all([
        persistState(storageKeys.ACCOUNTS, accounts),
        persistState(storageKeys.TRANSACTIONS, transactions),
        persistState(storageKeys.LAST_SYNC, new Date().toISOString()),
      ]);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'SET_CONNECTION_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const toggleBalances = (): void => {
    const newValue = !state.showBalances;
    dispatch({ type: 'SET_SHOW_BALANCES', payload: newValue });
    persistState(storageKeys.SHOW_BALANCES, newValue);
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Computed values
  const totalBalance = state.accounts.reduce((sum, account) => sum + (account.current_balance || 0), 0);
  const hasAccounts = state.accounts.length > 0;
  const isLoading = state.isConnecting;

  const contextValue: PlaidContextType = {
    state: {
      ...state,
      totalBalance,
      hasAccounts,
    },
    dispatch,
    connectBank,
    disconnectBank,
    refreshData,
    toggleBalances,
    clearError,
    totalBalance,
    hasAccounts,
    isLoading,
    // Expose handlers for PlaidLink component
    handlePlaidSuccess,
    handlePlaidExit,
  };

  return (
    <PlaidContext.Provider value={contextValue}>
      {children}
    </PlaidContext.Provider>
  );
}

// Hook to use Plaid context
export function usePlaid(): PlaidContextType {
  const context = useContext(PlaidContext);
  if (context === undefined) {
    throw new Error('usePlaid must be used within a PlaidProvider');
  }
  return context;
}

// Export types for use in other components
export type { PlaidContextType };
