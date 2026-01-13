const { logger } = require('../logger');
const emailProvider = require('./emailProvider');

/**
 * Notification Manager
 * Orchestrates security alert notifications across multiple channels
 */

/**
 * Get notification channels for a given severity level
 */
function getChannelsForSeverity(severity) {
  // Default routing configuration
  const routingConfig = {
    CRITICAL: process.env.ALERT_ROUTING_CRITICAL || 'email,slack',
    HIGH: process.env.ALERT_ROUTING_HIGH || 'email,slack',
    MEDIUM: process.env.ALERT_ROUTING_MEDIUM || 'email',
    LOW: process.env.ALERT_ROUTING_LOW || 'email',
  };

  const channels = routingConfig[severity] || routingConfig.MEDIUM;
  return channels.split(',').map(ch => ch.trim()).filter(ch => ch);
}

/**
 * Send notifications for a security alert
 * Routes alerts to appropriate channels based on severity and configuration
 */
async function sendNotifications(alert) {
  try {
    const channels = getChannelsForSeverity(alert.severity);
    const promises = [];

    logger.debug('Sending security alert notifications', {
      alertType: alert.type,
      severity: alert.severity,
      channels,
    });

    // Email notifications
    if (channels.includes('email')) {
      if (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
        promises.push(
          emailProvider.sendEmailAlert(alert).catch(err => {
            logger.error('Email notification failed', {
              error: err.message,
              alertType: alert.type,
            });
            // Don't throw - we want other channels to still work
          })
        );
      } else {
        logger.debug('Email notifications disabled');
      }
    }

    // Slack notifications (placeholder for future implementation)
    if (channels.includes('slack')) {
      if (process.env.ENABLE_SLACK_NOTIFICATIONS === 'true') {
        // TODO: Implement Slack provider in Phase 2
        logger.debug('Slack notifications not yet implemented');
      } else {
        logger.debug('Slack notifications disabled');
      }
    }

    // Wait for all notifications to complete (or fail gracefully)
    const results = await Promise.allSettled(promises);

    // Log results
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    if (succeeded > 0) {
      logger.info('Security alert notifications sent', {
        alertType: alert.type,
        severity: alert.severity,
        succeeded,
        failed,
        totalChannels: channels.length,
      });
    }

    if (failed > 0) {
      logger.warn('Some notification channels failed', {
        alertType: alert.type,
        failed,
        totalChannels: channels.length,
      });
    }

    return {
      success: succeeded > 0,
      succeeded,
      failed,
      totalChannels: channels.length,
    };
  } catch (error) {
    logger.error('Failed to send notifications', {
      error: error.message,
      alertType: alert.type,
    });
    // Don't throw - notifications are non-blocking
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  sendNotifications,
  getChannelsForSeverity,
};

