const { logger } = require('./logger');
const supabase = require('../config/supabase');
const { sendNotifications } = require('./notifications');

/**
 * Security Alerts System
 * Provides alerting for security-relevant events
 */

// Alert thresholds
const ALERT_THRESHOLDS = {
  FAILED_AUTH_ATTEMPTS: 5, // Alert after 5 failed auth attempts
  QUOTA_VIOLATIONS_HOUR: 10, // Alert after 10 quota violations per hour
  SUSPICIOUS_API_PATTERNS: 3, // Alert after 3 suspicious patterns
  CRITICAL_ERRORS_HOUR: 20, // Alert after 20 critical errors per hour
};

// In-memory tracking (in production, use Redis or database)
const alertTracking = {
  failedAuth: new Map(), // userId -> count
  quotaViolations: new Map(), // userId -> count
  suspiciousPatterns: new Map(), // pattern -> count
  criticalErrors: [], // Array of timestamps
};

// Cleanup old tracking data (run periodically)
function cleanupAlertTracking() {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  
  // Clean up failed auth attempts older than 1 hour
  for (const [userId, data] of alertTracking.failedAuth.entries()) {
    if (data.timestamp < oneHourAgo) {
      alertTracking.failedAuth.delete(userId);
    }
  }
  
  // Clean up quota violations older than 1 hour
  for (const [userId, data] of alertTracking.quotaViolations.entries()) {
    if (data.timestamp < oneHourAgo) {
      alertTracking.quotaViolations.delete(userId);
    }
  }
  
  // Clean up critical errors older than 1 hour
  alertTracking.criticalErrors = alertTracking.criticalErrors.filter(
    timestamp => timestamp > oneHourAgo
  );
}

/**
 * Track and alert on failed authentication attempts
 */
function trackFailedAuth(userId, ipAddress, requestId) {
  const now = Date.now();
  const key = `${userId}:${ipAddress}`;
  
  if (!alertTracking.failedAuth.has(key)) {
    alertTracking.failedAuth.set(key, { count: 0, timestamp: now });
  }
  
  const tracking = alertTracking.failedAuth.get(key);
  tracking.count++;
  tracking.timestamp = now;
  
  if (tracking.count >= ALERT_THRESHOLDS.FAILED_AUTH_ATTEMPTS) {
    logger.warn('SECURITY ALERT: Multiple failed authentication attempts', {
      userId,
      ipAddress,
      failedAttempts: tracking.count,
      requestId,
      alertType: 'FAILED_AUTH_ATTEMPTS',
    });
    
    // In production, send alert (email, Slack, etc.)
    sendSecurityAlert({
      type: 'FAILED_AUTH_ATTEMPTS',
      severity: 'HIGH',
      message: `User ${userId} has ${tracking.count} failed authentication attempts from IP ${ipAddress}`,
      userId,
      ipAddress,
      count: tracking.count,
    });
  }
  
  cleanupAlertTracking();
}

/**
 * Track and alert on quota violations
 */
function trackQuotaViolation(userId, quotaType, requestId) {
  const now = Date.now();
  const key = `${userId}:${quotaType}`;
  
  if (!alertTracking.quotaViolations.has(key)) {
    alertTracking.quotaViolations.set(key, { count: 0, timestamp: now });
  }
  
  const tracking = alertTracking.quotaViolations.get(key);
  tracking.count++;
  tracking.timestamp = now;
  
  if (tracking.count >= ALERT_THRESHOLDS.QUOTA_VIOLATIONS_HOUR) {
    logger.warn('SECURITY ALERT: Excessive quota violations', {
      userId,
      quotaType,
      violations: tracking.count,
      requestId,
      alertType: 'QUOTA_VIOLATIONS',
    });
    
    sendSecurityAlert({
      type: 'QUOTA_VIOLATIONS',
      severity: 'MEDIUM',
      message: `User ${userId} has ${tracking.count} quota violations for ${quotaType} in the last hour`,
      userId,
      quotaType,
      count: tracking.count,
    });
  }
  
  cleanupAlertTracking();
}

/**
 * Track and alert on suspicious API usage patterns
 */
function trackSuspiciousPattern(pattern, userId, details, requestId) {
  const key = `${pattern}:${userId}`;
  
  if (!alertTracking.suspiciousPatterns.has(key)) {
    alertTracking.suspiciousPatterns.set(key, { count: 0, timestamp: Date.now() });
  }
  
  const tracking = alertTracking.suspiciousPatterns.get(key);
  tracking.count++;
  tracking.timestamp = Date.now();
  
  if (tracking.count >= ALERT_THRESHOLDS.SUSPICIOUS_API_PATTERNS) {
    logger.warn('SECURITY ALERT: Suspicious API usage pattern detected', {
      pattern,
      userId,
      occurrences: tracking.count,
      details,
      requestId,
      alertType: 'SUSPICIOUS_PATTERN',
    });
    
    sendSecurityAlert({
      type: 'SUSPICIOUS_PATTERN',
      severity: 'HIGH',
      message: `Suspicious pattern "${pattern}" detected ${tracking.count} times for user ${userId}`,
      userId,
      pattern,
      details,
      count: tracking.count,
    });
  }
}

/**
 * Track and alert on critical errors
 */
function trackCriticalError(error, context, requestId) {
  const now = Date.now();
  alertTracking.criticalErrors.push(now);
  
  // Count errors in last hour
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  const recentErrors = alertTracking.criticalErrors.filter(t => t > oneHourAgo);
  
  if (recentErrors.length >= ALERT_THRESHOLDS.CRITICAL_ERRORS_HOUR) {
    logger.error('SECURITY ALERT: Excessive critical errors', {
      errorCount: recentErrors.length,
      error: error.message,
      context,
      requestId,
      alertType: 'CRITICAL_ERRORS',
    });
    
    sendSecurityAlert({
      type: 'CRITICAL_ERRORS',
      severity: 'HIGH',
      message: `${recentErrors.length} critical errors occurred in the last hour`,
      errorCount: recentErrors.length,
      context,
    });
  }
  
  cleanupAlertTracking();
}

/**
 * Send security alert
 * Logs to audit logs and sends notifications via configured channels
 */
async function sendSecurityAlert(alert) {
  // Log to audit logs
  try {
    await supabase.from('audit_logs').insert([{
      user_id: alert.userId || null,
      event_type: `SECURITY_ALERT_${alert.type}`,
      resource_type: 'SECURITY',
      resource_id: null,
      details: {
        alertType: alert.type,
        severity: alert.severity,
        message: alert.message,
        ...alert,
      },
      success: false, // Alerts indicate problems
    }]);
  } catch (error) {
    logger.error('Failed to log security alert to audit logs', {
      error: error.message,
      alert,
    });
  }
  
  // Send notifications via configured channels (email, Slack, etc.)
  try {
    await sendNotifications(alert);
  } catch (error) {
    // Don't fail alert logging if notifications fail
    logger.error('Failed to send security alert notifications', {
      error: error.message,
      alertType: alert.type,
    });
  }
  
  logger.warn('SECURITY ALERT', alert);
}

/**
 * Get security alert statistics
 */
function getAlertStatistics() {
  cleanupAlertTracking();
  
  return {
    failedAuthAttempts: alertTracking.failedAuth.size,
    quotaViolations: alertTracking.quotaViolations.size,
    suspiciousPatterns: alertTracking.suspiciousPatterns.size,
    criticalErrorsLastHour: alertTracking.criticalErrors.filter(
      t => t > Date.now() - (60 * 60 * 1000)
    ).length,
  };
}

module.exports = {
  trackFailedAuth,
  trackQuotaViolation,
  trackSuspiciousPattern,
  trackCriticalError,
  sendSecurityAlert,
  getAlertStatistics,
  ALERT_THRESHOLDS,
};

