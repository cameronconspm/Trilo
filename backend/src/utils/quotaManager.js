const supabase = require('../config/supabase');
const { logger } = require('./logger');

/**
 * Quota Manager - Manages per-user quotas for cost control
 */

// Default quota limits
const DEFAULT_QUOTAS = {
  plaid_link_token: { hour: 5, day: 20 },
  plaid_connections: { lifetime: 10, day: 3 },
  plaid_syncs: { day: 10 }, // Total syncs per day per user
  plaid_balance_queries: { hour: 20, day: 100 },
  plaid_deletions: { day: 10 },
  sms_codes: { day: 10 },
};

// Per-account sync limits
const SYNC_LIMITS = {
  perAccountPerDay: 4,
  minIntervalHours: 1, // Minimum time between syncs for same account
};

/**
 * Get or create quota record for a user
 */
async function getOrCreateQuota(userId, quotaType, period, limit) {
  const periodStart = getPeriodStart(period);
  
  // Try to get existing quota
  const { data: existing, error: fetchError } = await supabase
    .from('user_quotas')
    .select('*')
    .eq('user_id', userId)
    .eq('quota_type', quotaType)
    .eq('period', period)
    .eq('period_start', periodStart.toISOString())
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') {
    logger.error('Error fetching quota', {
      error: fetchError.message,
      userId,
      quotaType,
      period,
    });
    throw fetchError;
  }

  if (existing) {
    return existing;
  }

  // Create new quota record
  const { data: newQuota, error: createError } = await supabase
    .from('user_quotas')
    .insert({
      user_id: userId,
      quota_type: quotaType,
      period: period,
      current_count: 0,
      limit_count: limit,
      period_start: periodStart.toISOString(),
    })
    .select()
    .single();

  if (createError) {
    logger.error('Error creating quota', {
      error: createError.message,
      userId,
      quotaType,
      period,
    });
    throw createError;
  }

  return newQuota;
}

/**
 * Check if user has quota available
 */
async function checkQuota(userId, quotaType, period = 'day') {
  const limits = DEFAULT_QUOTAS[quotaType];
  if (!limits || !limits[period]) {
    logger.warn('Unknown quota type or period', { quotaType, period, userId });
    return { allowed: true, remaining: Infinity };
  }

  const limit = limits[period];
  
  try {
    const quota = await getOrCreateQuota(userId, quotaType, period, limit);
    
    return {
      allowed: quota.current_count < quota.limit_count,
      remaining: Math.max(0, quota.limit_count - quota.current_count),
      current: quota.current_count,
      limit: quota.limit_count,
      quota,
    };
  } catch (error) {
    logger.error('Error checking quota', {
      error: error.message,
      userId,
      quotaType,
      period,
    });
    // On error, allow the request (fail open to avoid blocking legitimate users)
    // But log the error for investigation
    return { allowed: true, remaining: Infinity, error: error.message };
  }
}

/**
 * Increment quota counter
 */
async function incrementQuota(userId, quotaType, period = 'day', amount = 1) {
  const limits = DEFAULT_QUOTAS[quotaType];
  if (!limits || !limits[period]) {
    return; // No quota defined for this type/period
  }

  const periodStart = getPeriodStart(period);
  
  try {
    // Get or create quota
    const quota = await getOrCreateQuota(userId, quotaType, period, limits[period]);
    
    // Increment count
    const { error: updateError } = await supabase
      .from('user_quotas')
      .update({
        current_count: quota.current_count + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', quota.id);

    if (updateError) {
      logger.error('Error incrementing quota', {
        error: updateError.message,
        userId,
        quotaType,
        period,
      });
    }
  } catch (error) {
    logger.error('Error in incrementQuota', {
      error: error.message,
      userId,
      quotaType,
      period,
    });
    // Don't throw - quota tracking failure shouldn't block operations
  }
}

/**
 * Get period start timestamp based on period type
 */
function getPeriodStart(period) {
  const now = new Date();
  
  switch (period) {
    case 'hour':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
    case 'day':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    case 'lifetime':
      return new Date(0); // Unix epoch start
    default:
      return now;
  }
}

/**
 * Check account sync quota and timing
 */
async function checkAccountSyncQuota(accountId, userId) {
  try {
    // Check per-account sync limit
    const today = new Date().toISOString().split('T')[0];
    const { data: syncTracking, error: fetchError } = await supabase
      .from('account_sync_tracking')
      .select('*')
      .eq('account_id', accountId)
      .eq('sync_date', today)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    // Check if minimum interval has passed
    if (syncTracking?.last_sync_at) {
      const lastSync = new Date(syncTracking.last_sync_at);
      const minIntervalMs = SYNC_LIMITS.minIntervalHours * 60 * 60 * 1000;
      const timeSinceLastSync = Date.now() - lastSync.getTime();
      
      if (timeSinceLastSync < minIntervalMs) {
        const minutesRemaining = Math.ceil((minIntervalMs - timeSinceLastSync) / (60 * 1000));
        return {
          allowed: false,
          reason: 'min_interval',
          minutesRemaining,
          retryAfter: Math.ceil((minIntervalMs - timeSinceLastSync) / 1000),
        };
      }
    }

    // Check per-account daily limit
    const currentCount = syncTracking?.sync_count_today || 0;
    if (currentCount >= SYNC_LIMITS.perAccountPerDay) {
      return {
        allowed: false,
        reason: 'per_account_daily_limit',
        current: currentCount,
        limit: SYNC_LIMITS.perAccountPerDay,
      };
    }

    // Check user's total sync quota
    const userSyncQuota = await checkQuota(userId, 'plaid_syncs', 'day');
    if (!userSyncQuota.allowed) {
      return {
        allowed: false,
        reason: 'user_daily_limit',
        remaining: userSyncQuota.remaining,
        limit: userSyncQuota.limit,
      };
    }

    return {
      allowed: true,
      syncTracking,
      userQuotaRemaining: userSyncQuota.remaining,
    };
  } catch (error) {
    logger.error('Error checking account sync quota', {
      error: error.message,
      accountId,
      userId,
    });
    // Fail open - allow sync if quota check fails
    return { allowed: true, error: error.message };
  }
}

/**
 * Record account sync
 */
async function recordAccountSync(accountId, userId, syncCursor = null) {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();
  
  try {
    // Get or create sync tracking record
    const { data: existing, error: fetchError } = await supabase
      .from('account_sync_tracking')
      .select('*')
      .eq('account_id', accountId)
      .eq('sync_date', today)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existing) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('account_sync_tracking')
        .update({
          last_sync_at: now,
          last_sync_cursor: syncCursor || existing.last_sync_cursor,
          sync_count_today: (existing.sync_count_today || 0) + 1,
          updated_at: now,
        })
        .eq('id', existing.id);

      if (updateError) {
        logger.error('Error updating sync tracking', {
          error: updateError.message,
          accountId,
        });
      }
    } else {
      // Create new record
      const { error: createError } = await supabase
        .from('account_sync_tracking')
        .insert({
          account_id: accountId,
          user_id: userId,
          last_sync_at: now,
          last_sync_cursor: syncCursor,
          sync_count_today: 1,
          sync_date: today,
        });

      if (createError) {
        logger.error('Error creating sync tracking', {
          error: createError.message,
          accountId,
        });
      }
    }

    // Increment user's total sync quota
    await incrementQuota(userId, 'plaid_syncs', 'day');
  } catch (error) {
    logger.error('Error recording account sync', {
      error: error.message,
      accountId,
      userId,
    });
    // Don't throw - tracking failure shouldn't block sync
  }
}

/**
 * Get quota status for a user (for debugging/admin)
 */
async function getUserQuotaStatus(userId) {
  const status = {};
  
  for (const [quotaType, periods] of Object.entries(DEFAULT_QUOTAS)) {
    status[quotaType] = {};
    for (const period of Object.keys(periods)) {
      const quota = await checkQuota(userId, quotaType, period);
      status[quotaType][period] = {
        current: quota.current || 0,
        limit: quota.limit || DEFAULT_QUOTAS[quotaType][period],
        remaining: quota.remaining || 0,
      };
    }
  }
  
  return status;
}

module.exports = {
  checkQuota,
  incrementQuota,
  checkAccountSyncQuota,
  recordAccountSync,
  getUserQuotaStatus,
  DEFAULT_QUOTAS,
  SYNC_LIMITS,
};

