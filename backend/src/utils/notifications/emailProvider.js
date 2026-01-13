const { logger } = require('../logger');

/**
 * Email Notification Provider
 * Sends security alerts via email using SMTP (nodemailer) or SendGrid
 */

let transporter = null;

/**
 * Initialize email transporter based on configuration
 */
function initializeTransporter() {
  if (transporter) {
    return transporter;
  }

  const emailService = process.env.EMAIL_SERVICE || 'smtp';
  
  if (emailService === 'sendgrid') {
    // SendGrid implementation (requires @sendgrid/mail package)
    // For now, we'll use SMTP which works with SendGrid's SMTP API
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || 'apikey',
        pass: process.env.SENDGRID_API_KEY || process.env.SMTP_PASSWORD,
      },
    });
  } else {
    // Standard SMTP
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  return transporter;
}

/**
 * Format alert as HTML email
 */
function formatAlertEmail(alert) {
  const severityColors = {
    CRITICAL: '#dc3545', // red
    HIGH: '#fd7e14', // orange
    MEDIUM: '#ffc107', // yellow
    LOW: '#6c757d', // gray
  };

  const color = severityColors[alert.severity] || '#6c757d';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: ${color}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; border-top: none; }
    .alert-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 4px; border-left: 4px solid ${color}; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #495057; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Security Alert: ${alert.type}</h1>
      <p style="margin: 5px 0 0 0;">Severity: ${alert.severity}</p>
    </div>
    <div class="content">
      <div class="alert-details">
        <div class="detail-row">
          <span class="detail-label">Alert Type:</span> ${alert.type}
        </div>
        <div class="detail-row">
          <span class="detail-label">Severity:</span> ${alert.severity}
        </div>
        <div class="detail-row">
          <span class="detail-label">Timestamp:</span> ${new Date().toISOString()}
        </div>
        ${alert.userId ? `<div class="detail-row"><span class="detail-label">User ID:</span> ${alert.userId}</div>` : ''}
        ${alert.ipAddress ? `<div class="detail-row"><span class="detail-label">IP Address:</span> ${alert.ipAddress}</div>` : ''}
        ${alert.quotaType ? `<div class="detail-row"><span class="detail-label">Quota Type:</span> ${alert.quotaType}</div>` : ''}
        ${alert.count ? `<div class="detail-row"><span class="detail-label">Count:</span> ${alert.count}</div>` : ''}
        ${alert.pattern ? `<div class="detail-row"><span class="detail-label">Pattern:</span> ${alert.pattern}</div>` : ''}
      </div>
      
      <div class="alert-details">
        <div class="detail-label">Message:</div>
        <p>${alert.message || 'No additional details provided.'}</p>
      </div>

      ${alert.details ? `
      <div class="alert-details">
        <div class="detail-label">Additional Details:</div>
        <pre style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto;">${JSON.stringify(alert.details, null, 2)}</pre>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      <p>This is an automated security alert from Trilo Backend.</p>
      <p>Please review this alert and take appropriate action if necessary.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send security alert via email
 */
async function sendEmailAlert(alert) {
  try {
    // Check if email notifications are enabled
    if (process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'true') {
      logger.debug('Email notifications are disabled');
      return;
    }

    // Validate required configuration
    const emailFrom = process.env.EMAIL_FROM;
    const emailTo = process.env.EMAIL_TO;

    if (!emailFrom || !emailTo) {
      logger.warn('Email notifications enabled but EMAIL_FROM or EMAIL_TO not configured');
      return;
    }

    // Initialize transporter
    const mailTransporter = initializeTransporter();

    // Parse recipients (comma-separated)
    const recipients = emailTo.split(',').map(email => email.trim()).filter(email => email);

    if (recipients.length === 0) {
      logger.warn('No valid email recipients configured');
      return;
    }

    // Prepare email options
    const mailOptions = {
      from: emailFrom,
      to: recipients,
      subject: `[${alert.severity}] Security Alert: ${alert.type}`,
      html: formatAlertEmail(alert),
      text: `${alert.severity} Security Alert: ${alert.type}\n\n${alert.message || 'No additional details.'}\n\nTimestamp: ${new Date().toISOString()}`,
    };

    // Send email
    const info = await mailTransporter.sendMail(mailOptions);
    logger.info('Security alert email sent successfully', {
      messageId: info.messageId,
      recipients: recipients.length,
      alertType: alert.type,
    });

    return info;
  } catch (error) {
    logger.error('Failed to send email notification', {
      error: error.message,
      alertType: alert.type,
    });
    throw error;
  }
}

module.exports = {
  sendEmailAlert,
};

