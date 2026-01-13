/**
 * Shared Storage Key Utilities
 * 
 * Centralizes storage key generation logic to reduce duplication
 * across different contexts. All keys are user-specific for data isolation.
 */

/**
 * Generate storage keys for finance context
 */
export function getFinanceStorageKeys(userId: string) {
  return {
    TRANSACTIONS: `finance_transactions_v2_${userId}`,
    BUDGET_GOALS: `finance_budget_goals_v2_${userId}`,
    LAST_BACKUP: `finance_last_backup_v2_${userId}`,
    APP_VERSION: `finance_app_version_${userId}`,
    MILESTONES: `finance_milestones_v2_${userId}`,
    PLANNING_STREAK: `finance_planning_streak_v2_${userId}`,
  };
}

/**
 * Generate storage keys for Plaid context
 */
export function getPlaidStorageKeys(userId: string) {
  return {
    ACCOUNTS: `plaid_accounts_${userId}`,
    TRANSACTIONS: `plaid_transactions_${userId}`,
    LAST_SYNC: `plaid_last_sync_${userId}`,
    SHOW_BALANCES: `plaid_show_balances_${userId}`,
    FIRST_TIME: `plaid_first_time_${userId}`,
  };
}

/**
 * Generate storage keys for settings context
 */
export function getSettingsStorageKeys(userId: string) {
  return {
    USER_PREFERENCES: `settings_user_preferences_v2_${userId}`,
    SETTINGS_VERSION: `settings_version_${userId}`,
    // Legacy keys for migration
    THEME: `settings_theme_${userId}`,
    BANK_CONNECTED: `settings_bank_connected_${userId}`,
  };
}

/**
 * Generate storage keys for savings context
 */
export function getSavingsStorageKeys(userId: string) {
  return {
    GOALS: `savings_goals_${userId}`,
  };
}

/**
 * Common storage keys (not user-specific)
 */
export const COMMON_STORAGE_KEYS = {
  SESSION: '@trilo:supabase_session',
  ONBOARDING_COMPLETED: '@trilo:onboarding_completed',
  SETUP_COMPLETED_PREFIX: '@trilo:setup_completed_',
  NAVIGATION_STATE: '@trilo:navigation_state',
} as const;

