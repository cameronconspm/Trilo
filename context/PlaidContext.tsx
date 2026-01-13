import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { isMFAEnabled } from '@/services/mfaService';
import { useAuth } from './AuthContext';
import { log } from '@/utils/logger';
import { SYNC_INTERVALS, NETWORK_TIMEOUTS } from '@/constants/timing';

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
  reorderAccounts: (orderedIds: string[]) => Promise<void>;
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

// Environment-aware API Base URL
// Priority: EXPO_PUBLIC env var > app.json extra > fallback
const getApiBaseUrl = (): string => {
  // Check environment variable first
  if (process.env.EXPO_PUBLIC_PLAID_API_URL) {
    return process.env.EXPO_PUBLIC_PLAID_API_URL;
  }
  
  // Check app.json extra config
  const apiUrl = Constants.expoConfig?.extra?.plaidApiUrl;
  if (apiUrl) {
    return apiUrl;
  }
  
  // Fallback: use production URL
  // For TestFlight/testing, you can override via EXPO_PUBLIC_PLAID_API_URL
  return 'https://trilo-production.up.railway.app/api/plaid';
};

const API_BASE_URL = getApiBaseUrl();

// Provider component
interface PlaidProviderProps {
  children: React.ReactNode;
  userId: string;
}

export function PlaidProvider({ children, userId }: PlaidProviderProps) {
  const [state, dispatch] = useReducer(plaidReducer, initialState);

  // Get user-specific storage keys for this component instance
  const storageKeys = getStorageKeys(userId);

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

  // Load persisted state on mount and when user changes
  useEffect(() => {
    loadPersistedState();
  }, [userId]); // Reload when user changes

  // Automatic sync effect will be added after refreshData is defined

  // Persist state to AsyncStorage
  const persistState = useCallback(async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error persisting ${key}:`, error);
    }
  }, []);

  // API functions
  const createLinkToken = async (retryCount = 0): Promise<string> => {
    const maxRetries = 2;
    
    try {
      log('[Plaid] 🔗 Creating link token...');
      log('[Plaid]   API Base URL:', API_BASE_URL);
      log('[Plaid]   User ID:', userId);
      log('[Plaid]   Retry attempt:', retryCount);
      
      const response = await fetch(`${API_BASE_URL}/link/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      log('[Plaid]   Response Status:', response.status);
      log('[Plaid]   Response OK:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Plaid] ❌ Link token creation failed');
        console.error('[Plaid]   Status:', response.status);
        console.error('[Plaid]   Status Text:', response.statusText);
        console.error('[Plaid]   Response Body:', errorText);
        
        // Retry on server errors (5xx) or network issues
        if ((response.status >= 500 || response.status === 0) && retryCount < maxRetries) {
          console.log(`[Plaid]   Retrying... (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, NETWORK_TIMEOUTS.RETRY_BASE_DELAY * (retryCount + 1))); // Exponential backoff
          return createLinkToken(retryCount + 1);
        }
        
        throw new Error(`Failed to create link token: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.link_token) {
        throw new Error('Invalid response: link_token not found');
      }
      
      log('[Plaid] ✅ Link token created successfully');
      log('[Plaid]   Link Token:', data.link_token.substring(0, 20) + '...');
      
      return data.link_token;
    } catch (error) {
      // Always log errors
      console.error('[Plaid] ❌ Error creating link token:', error);
      
      if (error instanceof Error) {
        const errorDetails = {
          name: error.name,
          message: error.message,
          stack: error.stack,
          retryCount,
        };
        console.error('[Plaid]   Error Details:', JSON.stringify(errorDetails, null, 2));
        
        // Retry on network errors
        if ((error.message.includes('fetch') || error.message.includes('Network') || error.message.includes('Failed to fetch')) && retryCount < maxRetries) {
          console.log(`[Plaid]   Retrying due to network error... (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, NETWORK_TIMEOUTS.RETRY_BASE_DELAY * (retryCount + 1))); // Exponential backoff
          return createLinkToken(retryCount + 1);
        }
      }
      
      throw error;
    }
  };

  const fetchAccounts = async (): Promise<BankAccount[]> => {
    try {
      log('[Plaid] 📥 Fetching accounts...');
      const response = await fetch(`${API_BASE_URL}/accounts/${userId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Plaid] ❌ Failed to fetch accounts');
        console.error('[Plaid]   Status:', response.status);
        console.error('[Plaid]   Response:', errorText);
        throw new Error(`Failed to fetch accounts: ${response.status} ${response.statusText}`);
      }
      
      const accounts = await response.json();
      log('[Plaid] ✅ Accounts fetched:', accounts.length);
      return accounts;
    } catch (error) {
      console.error('[Plaid] ❌ Error fetching accounts:', error);
      if (error instanceof Error) {
        console.error('[Plaid]   Error Details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
      throw error;
    }
  };

  const fetchTransactions = async (): Promise<Transaction[]> => {
    try {
      log('[Plaid] 📥 Fetching transactions...');
      const response = await fetch(`${API_BASE_URL}/transactions/${userId}?limit=50`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Plaid] ❌ Failed to fetch transactions');
        console.error('[Plaid]   Status:', response.status);
        console.error('[Plaid]   Response:', errorText);
        throw new Error(`Failed to fetch transactions: ${response.status} ${response.statusText}`);
      }
      
      const transactions = await response.json();
      log('[Plaid] ✅ Transactions fetched:', transactions.length);
      return transactions;
    } catch (error) {
      console.error('[Plaid] ❌ Error fetching transactions:', error);
      if (error instanceof Error) {
        console.error('[Plaid]   Error Details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
      throw error;
    }
  };

  const exchangePublicToken = async (publicToken: string, selectedAccountIds?: string[]): Promise<void> => {
    try {
      log('[Plaid] 🔄 Exchanging public token for access token...');
      log('[Plaid]   Public Token:', publicToken.substring(0, 20) + '...');
      log('[Plaid]   User ID:', userId);
      log('[Plaid]   Selected Account IDs:', selectedAccountIds?.length || 0);
      if (selectedAccountIds && selectedAccountIds.length > 0) {
        log('[Plaid]   Account IDs:', selectedAccountIds);
      }
      
      const requestBody = {
        public_token: publicToken,
        userId: userId, // Backend expects camelCase 'userId', not snake_case 'user_id'
        selected_account_ids: selectedAccountIds, // Pass selected account IDs to backend
      };
      
      log('[Plaid]   Request Body:', JSON.stringify({
        public_token: requestBody.public_token.substring(0, 20) + '...',
        userId: requestBody.userId,
      }));
      
      const response = await fetch(`${API_BASE_URL}/link/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      log('[Plaid]   Response Status:', response.status);
      log('[Plaid]   Response OK:', response.ok);

      if (!response.ok) {
        let errorData;
        try {
          const errorText = await response.text();
          console.error('[Plaid] ❌ Token exchange failed');
          console.error('[Plaid]   Status:', response.status);
          console.error('[Plaid]   Status Text:', response.statusText);
          console.error('[Plaid]   Response Body:', errorText);
          
          // Try to parse error response for more details
          try {
            errorData = JSON.parse(errorText);
            console.error('[Plaid]   Error Details:', JSON.stringify(errorData, null, 2));
          } catch (e) {
            // If not JSON, use the text as is
            errorData = { error: errorText };
          }
        } catch (parseError) {
          console.error('[Plaid]   Failed to parse error response:', parseError);
          errorData = { error: 'Unknown error occurred' };
        }
        
        // Use detailed error message if available
        const errorMessage = errorData?.details || errorData?.error || `Exchange failed: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      log('[Plaid] ✅ Token exchange successful');
      log('[Plaid]   Exchange Result:', JSON.stringify(data, null, 2));
    } catch (error) {
      // Always log errors
      console.error('[Plaid] ❌ Token exchange failed:', error);
      if (error instanceof Error) {
        const errorDetails = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
        console.error('[Plaid]   Error Details:', JSON.stringify(errorDetails, null, 2));
      }
      throw error;
    }
  };

  // Actions
  const connectBank = async (): Promise<void> => {
    try {
      log('[Plaid] 🔗 Starting bank connection...');
      dispatch({ type: 'SET_CONNECTING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // MFA verification check is done in the banking screen component before calling connectBank
      // This ensures users must verify MFA before accessing Plaid Link

      // Get link token
      const token = await createLinkToken();
      
      if (!token) {
        throw new Error('Link token is empty or invalid');
      }
      
      dispatch({ type: 'SET_LINK_TOKEN', payload: token });
      log('[Plaid] ✅ Link token received and stored');

      // The actual Plaid Link will be handled by the PlaidLink component
      // This function just prepares the state
    } catch (error) {
      console.error('[Plaid] ❌ Failed to connect bank:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (error instanceof Error) {
        console.error('[Plaid]   Error Details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
      
      dispatch({ type: 'SET_CONNECTION_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_CONNECTING', payload: false });
      throw error;
    }
  };

  const handlePlaidSuccess = async (publicToken: string, metadata: PlaidLinkMetadata): Promise<void> => {
    try {
      log('[Plaid] 🔄 Processing successful Plaid connection...');
      log('[Plaid]   Institution:', metadata.institution?.name || 'Unknown');
      log('[Plaid]   Account Count:', metadata.accounts?.length || 0);
      
      // Extract selected account IDs from metadata
      const selectedAccountIds = metadata.accounts?.map(account => account.id) || [];
      log('[Plaid]   Selected Account IDs:', selectedAccountIds);
      
      // Exchange public token for access token, passing selected account IDs
      await exchangePublicToken(publicToken, selectedAccountIds);
      
      // Fetch updated accounts and transactions
      log('[Plaid] 📥 Fetching accounts and transactions...');
      const [accounts, transactions] = await Promise.all([
        fetchAccounts(),
        fetchTransactions(),
      ]);
      
      log('[Plaid] ✅ Connection complete');
      log('[Plaid]   Accounts:', accounts.length);
      log('[Plaid]   Transactions:', transactions.length);
      
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
      
      log('[Plaid] ✅ State persisted successfully');
      
    } catch (error) {
      console.error('[Plaid] ❌ Failed to process Plaid success:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (error instanceof Error) {
        console.error('[Plaid]   Error Details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
      
      dispatch({ type: 'SET_CONNECTION_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const handlePlaidExit = (error: any): void => {
    log('[Plaid] 🚪 Plaid Link exited');
    if (error) {
      log('[Plaid]   Exit Error:', JSON.stringify(error, null, 2));
      const errorMessage = error.error_message || error.display_message || 'Connection was cancelled';
      dispatch({ type: 'SET_CONNECTION_ERROR', payload: errorMessage });
    } else {
      log('[Plaid]   User cancelled connection');
    }
    dispatch({ type: 'SET_CONNECTING', payload: false });
  };

  const disconnectBank = async (accountId: string): Promise<void> => {
    // OPTIMISTIC UPDATE: Remove from state immediately for better UX
    log('[Plaid] 🗑️  Disconnecting account:', accountId);
    log('[Plaid]   Current accounts:', state.accounts.map(a => ({ id: a.id, name: a.name })));
    
    // Remove from state optimistically (before backend call)
    const optimisticAccounts = state.accounts.filter(account => account.id !== accountId);
    const optimisticTransactions = state.transactions.filter(
      transaction => transaction.account_id !== accountId
    );
    
    dispatch({ type: 'SET_ACCOUNTS', payload: optimisticAccounts });
    dispatch({ type: 'SET_TRANSACTIONS', payload: optimisticTransactions });
    
    // Persist optimistic update
    await Promise.all([
      persistState(storageKeys.ACCOUNTS, optimisticAccounts),
      persistState(storageKeys.TRANSACTIONS, optimisticTransactions),
    ]);
    
    log('[Plaid]   ✅ Optimistically removed from state');
    
    // Now call backend to sync
    try {
      const response = await fetch(`${API_BASE_URL}/accounts/${accountId}`, {
        method: 'DELETE',
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        const text = await response.text().catch(() => 'Unknown error');
        result = { error: text || 'Failed to disconnect account' };
      }

      if (!response.ok) {
        // Backend says it failed, but we already removed from state
        // Check if it's a "not found" error - that's actually OK
        const isNotFound = response.status === 404 || 
                          result.alreadyDeleted || 
                          result.message?.includes('not found') ||
                          result.message?.includes('already deleted') ||
                          result.success; // Backend might return success even with 500
        
        if (isNotFound || result.success) {
          log('[Plaid]   ✅ Backend confirms account not found or already deleted');
          dispatch({ type: 'CLEAR_ERROR' });
          return; // Success - account is gone
        }
        
        // Real error - log detailed info for debugging
        console.error('[Plaid]   ❌ Backend deletion failed');
        console.error('[Plaid]   Status:', response.status);
        console.error('[Plaid]   Response:', JSON.stringify(result, null, 2));
        console.error('[Plaid]   Account ID attempted:', accountId);
        console.error('[Plaid]   Error details:', result.details);
        console.error('[Plaid]   Error code:', result.code);
        console.error('[Plaid]   Error message:', result.message);
        
        // IMPORTANT: Don't restore state - optimistic update stays
        // The account is already removed from UI, so keep it that way
        // Even if backend fails, user sees it removed (better UX)
        dispatch({ type: 'CLEAR_ERROR' });
        return;
      }

      // Backend confirms success
      log('[Plaid] ✅ Account disconnected from backend:', result);
      dispatch({ type: 'CLEAR_ERROR' });
      
    } catch (error) {
      // Network error or other issue - but we already removed from state
      // Log the error but don't restore state (optimistic update succeeded)
      console.warn('[Plaid]   ⚠️  Backend call failed, but account already removed from UI');
      console.warn('[Plaid]   Error:', error instanceof Error ? error.message : String(error));
      // Don't throw - optimistic update is fine
      dispatch({ type: 'CLEAR_ERROR' });
    }
  };

  const reorderAccounts = async (orderedIds: string[]): Promise<void> => {
    try {
      const idToAccount = new Map(state.accounts.map(acc => [acc.id, acc]));
      const reordered = orderedIds
        .map(id => idToAccount.get(id))
        .filter((acc): acc is BankAccount => !!acc);
      
      if (reordered.length === 0) {
        return;
      }

      dispatch({ type: 'SET_ACCOUNTS', payload: reordered });
      await persistState(storageKeys.ACCOUNTS, reordered);
    } catch (error) {
      console.error('[Plaid] ❌ Failed to reorder accounts:', error);
    }
  };

  const refreshData = useCallback(async (): Promise<void> => {
    try {
      // Use state.hasAccounts instead of state.accounts.length for stable dependency
      if (!state.hasAccounts) {
        log('[Plaid] ⏭️  Skipping refresh - no accounts');
        return;
      }

      log('[Plaid] 🔄 Refreshing bank data...');
      const [accounts, transactions] = await Promise.all([
        fetchAccounts(),
        fetchTransactions(),
      ]);
      
      log('[Plaid] ✅ Refresh complete');
      log('[Plaid]   Accounts:', accounts.length);
      log('[Plaid]   Transactions:', transactions.length);
      
      dispatch({ type: 'SET_ACCOUNTS', payload: accounts });
      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
      
      // Persist to storage
      await Promise.all([
        persistState(storageKeys.ACCOUNTS, accounts),
        persistState(storageKeys.TRANSACTIONS, transactions),
        persistState(storageKeys.LAST_SYNC, new Date().toISOString()),
      ]);
      
      log('[Plaid] ✅ Refresh data persisted');
      
    } catch (error) {
      console.error('[Plaid] ❌ Failed to refresh data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (error instanceof Error) {
        console.error('[Plaid]   Error Details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
      
      dispatch({ type: 'SET_CONNECTION_ERROR', payload: errorMessage });
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.hasAccounts, userId, persistState, dispatch]);

  // Automatic sync every 15 minutes
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!state.hasAccounts) {
      // Clear interval if no accounts
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      return;
    }

    // Clear any existing interval before creating a new one
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    syncIntervalRef.current = setInterval(async () => {
      try {
        if (__DEV__) {
          console.log('Auto-syncing bank data...');
        }
        await refreshData();
      } catch (error) {
        // Always log errors, even in production
        console.error('Auto-sync failed:', error);
      }
    }, SYNC_INTERVALS.PLAID_AUTO_SYNC);

    // Cleanup interval on unmount or when accounts/refreshData changes
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [state.hasAccounts, refreshData]);

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
    reorderAccounts,
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
