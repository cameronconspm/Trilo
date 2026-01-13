const supabase = require('../config/supabase');
const { logger } = require('../utils/logger');

/**
 * Audit logging middleware for financial operations
 * Logs all financial operations to the audit_logs table
 */

/**
 * Log an audit event
 */
async function logAuditEvent({
  userId,
  actionType,
  resourceType,
  resourceId = null,
  ipAddress = null,
  userAgent = null,
  requestId = null,
  success = true,
  errorMessage = null,
  metadata = null,
}) {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action_type: actionType,
        resource_type: resourceType,
        resource_id: resourceId,
        ip_address: ipAddress,
        user_agent: userAgent,
        request_id: requestId,
        success,
        error_message: errorMessage,
        metadata,
      });

    if (error) {
      // Don't throw error - audit logging failures shouldn't break the request
      logger.error('Failed to write audit log', { error: error.message, actionType, userId });
    }
  } catch (error) {
    // Don't throw error - audit logging failures shouldn't break the request
    logger.error('Exception writing audit log', { error: error.message, actionType, userId });
  }
}

/**
 * Middleware factory to create audit logging middleware for specific actions
 */
function auditMiddleware(actionType, resourceType, getResourceId = null) {
  return async (req, res, next) => {
    // Store original res.json to intercept responses
    const originalJson = res.json.bind(res);
    let responseSent = false;

    res.json = function(data) {
      if (!responseSent) {
        responseSent = true;
        
        // Determine success based on status code
        const success = res.statusCode >= 200 && res.statusCode < 400;
        
        // Get resource ID if function provided
        const resourceId = getResourceId ? getResourceId(req, data) : (req.params.accountId || req.params.userId || null);
        
        // Log audit event asynchronously (don't block response)
        logAuditEvent({
          userId: req.user?.id || 'unknown',
          actionType,
          resourceType,
          resourceId,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          requestId: req.id,
          success,
          errorMessage: success ? null : (data.error || data.message || 'Unknown error'),
          metadata: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
          },
        }).catch(err => {
          // Silent fail - already logged in logAuditEvent
        });
      }
      
      return originalJson(data);
    };

    next();
  };
}

/**
 * Helper to get resource ID from request/response
 */
function getResourceIdFromResponse(req, responseData) {
  if (responseData?.account?.id) return responseData.account.id;
  if (responseData?.accountId) return responseData.accountId;
  if (req.params?.accountId) return req.params.accountId;
  if (req.params?.userId) return req.params.userId;
  return null;
}

module.exports = {
  logAuditEvent,
  auditMiddleware,
  getResourceIdFromResponse,
};

