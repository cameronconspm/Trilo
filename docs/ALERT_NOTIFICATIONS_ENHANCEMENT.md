# Alert Notifications Enhancement Plan

**Last Updated:** January 2025  
**Version:** 1.0  
**Status:** Planning Phase

## Overview

This document outlines the enhancement plan for security alert notifications. Currently, security alerts are logged to audit_logs and console, but there's no external notification mechanism (email, Slack, etc.).

## Current State

### Existing Implementation

- **Security Alerts System**: `backend/src/utils/securityAlerts.js`
- **Alert Types**: Failed auth, quota violations, suspicious patterns, critical errors
- **Current Notification**: Logs to audit_logs table and console only
- **Alert Thresholds**: Configurable constants in securityAlerts.js

### Limitations

- No real-time notifications to administrators
- No integration with external services
- Alerts only visible in logs (require manual monitoring)
- No alert routing based on severity
- No alert aggregation/summarization

## Notification Options Research

### Option 1: Email Notifications

**Services:**
- **SendGrid**: Popular, reliable, good free tier
- **AWS SES**: Cost-effective, integrates well with AWS
- **Nodemailer**: Simple, works with any SMTP server
- **Mailgun**: Developer-friendly, good API

**Pros:**
- ✅ Simple to implement
- ✅ Universal (everyone has email)
- ✅ Good for all alert types
- ✅ Can include detailed information
- ✅ Works well for non-urgent alerts

**Cons:**
- ❌ May go to spam
- ❌ Not ideal for urgent/critical alerts
- ❌ Email delivery delays
- ❌ Requires email service setup

**Best For:**
- Daily/weekly summaries
- Non-critical alerts
- Compliance/audit notifications
- All alert types as fallback

**Implementation Complexity:** Low  
**Cost:** Low (free tiers available)

---

### Option 2: Slack Integration

**Services:**
- **Slack Webhooks**: Simple, no SDK required
- **Slack SDK (@slack/web-api)**: More features, better integration

**Pros:**
- ✅ Real-time notifications
- ✅ Good for team collaboration
- ✅ Rich formatting (blocks, attachments)
- ✅ Thread support for discussions
- ✅ Mobile app notifications
- ✅ Good for development/staging

**Cons:**
- ❌ Requires Slack workspace
- ❌ Not ideal for critical alerts (may be missed)
- ❌ Requires webhook URL setup

**Best For:**
- Development/staging environments
- Team notifications
- Non-critical alerts
- Real-time monitoring

**Implementation Complexity:** Low-Medium  
**Cost:** Free (if using existing Slack workspace)

---

### Option 3: Monitoring Services

**Services:**
- **Datadog**: Comprehensive monitoring, alerting, dashboards
- **New Relic**: Application performance + alerting
- **Sentry**: Error tracking + alerting (good for critical errors)
- **Grafana Cloud**: Open-source monitoring platform

**Pros:**
- ✅ Comprehensive solution
- ✅ Dashboards and visualization
- ✅ Alert aggregation and routing
- ✅ Integration with many services
- ✅ Good for production at scale
- ✅ Historical data and trends

**Cons:**
- ❌ Additional service to manage
- ❌ Costs increase with usage
- ❌ More complex setup
- ❌ May be overkill for small projects

**Best For:**
- Production environments
- Large-scale applications
- When comprehensive monitoring is needed
- Long-term alerting strategy

**Implementation Complexity:** Medium-High  
**Cost:** Medium-High (varies by service and usage)

---

### Option 4: PagerDuty (Critical Alerts Only)

**Service:**
- **PagerDuty API**: On-call management and incident response

**Pros:**
- ✅ Excellent for critical alerts
- ✅ On-call scheduling
- ✅ Escalation policies
- ✅ Incident management
- ✅ Mobile app with push notifications

**Cons:**
- ❌ Overkill for non-critical alerts
- ❌ Requires PagerDuty account
- ❌ More expensive
- ❌ Better suited for larger teams

**Best For:**
- Critical security incidents only
- Production environments with on-call teams
- When immediate response is required

**Implementation Complexity:** Medium  
**Cost:** Medium-High (paid service)

---

## Recommended Approach

### Phase 1: Email Notifications (HIGH Priority)

**Rationale:**
- Easiest to implement
- Works for all alert types
- Good starting point
- Universal delivery

**Implementation:**
1. Use Nodemailer with SMTP (or SendGrid API)
2. Send alerts to configured email address(es)
3. Support HTML emails with alert details
4. Configure per alert severity

**Timeline:** 2-4 hours

---

### Phase 2: Slack Integration (MEDIUM Priority)

**Rationale:**
- Better for team collaboration
- Real-time notifications
- Good for development/staging

**Implementation:**
1. Use Slack Webhooks (simple) or Slack SDK
2. Configure webhook URL per environment
3. Format alerts as Slack messages/blocks
4. Support alert routing to different channels

**Timeline:** 3-5 hours

---

### Phase 3: Monitoring Service (LOW Priority - Future)

**Rationale:**
- Comprehensive solution
- Better for production at scale
- Requires more planning and setup

**Implementation:**
- Evaluate monitoring service options
- Choose service (Datadog, Sentry, etc.)
- Integrate with service API
- Set up dashboards and alerting rules

**Timeline:** 1-2 days (depending on service)

---

## Architecture Design

### Notification Provider Abstraction

Create a provider-based architecture that supports multiple notification channels:

```
securityAlerts.js
    ↓
NotificationManager (orchestrates)
    ↓
    ├─→ EmailProvider
    ├─→ SlackProvider
    ├─→ MonitoringProvider (future)
    └─→ PagerDutyProvider (future, critical only)
```

### File Structure

```
backend/src/utils/notifications/
├── index.js                    # Notification manager/orchestrator
├── emailProvider.js            # Email notifications (Nodemailer/SendGrid)
├── slackProvider.js            # Slack notifications (webhooks/SDK)
├── monitoringProvider.js       # Monitoring service integration (future)
└── types.js                    # Type definitions (if using TypeScript)
```

### Configuration

Environment variables for notification services:

```env
# Email Notifications
ENABLE_EMAIL_NOTIFICATIONS=true
EMAIL_SERVICE=smtp  # or 'sendgrid'
EMAIL_FROM=noreply@trilo.app
EMAIL_TO=security@trilo.app,admin@trilo.app
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key

# Slack Notifications
ENABLE_SLACK_NOTIFICATIONS=true
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_CHANNEL=#security-alerts

# Alert Routing
ALERT_ROUTING_CRITICAL=email,slack  # Multiple channels
ALERT_ROUTING_HIGH=email,slack
ALERT_ROUTING_MEDIUM=email
ALERT_ROUTING_LOW=email  # Or disable for low severity
```

### Alert Routing Rules

| Severity | Default Channels | Notes |
|----------|------------------|-------|
| CRITICAL | Email, Slack | Immediate notification, multiple channels |
| HIGH | Email, Slack | Important alerts, team visibility |
| MEDIUM | Email | Standard alerts, email is sufficient |
| LOW | Email (optional) | May disable for low-priority alerts |

## Implementation Plan

### Step 1: Email Provider Implementation

**Files to Create:**
- `backend/src/utils/notifications/emailProvider.js`

**Features:**
- Send HTML email alerts
- Support multiple recipients
- Include alert details (type, severity, message, context)
- Error handling and retry logic
- Template support for different alert types

**Dependencies:**
- `nodemailer` (or `@sendgrid/mail`)

---

### Step 2: Update Security Alerts

**Files to Modify:**
- `backend/src/utils/securityAlerts.js`

**Changes:**
- Import notification manager
- Call notification manager in `sendSecurityAlert()`
- Pass alert details to notification system
- Handle notification errors gracefully (don't break alert logging)

---

### Step 3: Notification Manager

**Files to Create:**
- `backend/src/utils/notifications/index.js`

**Features:**
- Route alerts to appropriate providers based on configuration
- Support multiple notification channels per alert
- Aggregate notification errors
- Log notification delivery status

---

### Step 4: Slack Provider (Phase 2)

**Files to Create:**
- `backend/src/utils/notifications/slackProvider.js`

**Features:**
- Send Slack messages via webhook or SDK
- Format alerts as Slack blocks
- Support different channels per alert type
- Include actionable links/buttons

**Dependencies:**
- `@slack/webhook` (for webhooks) or `@slack/web-api` (for SDK)

---

### Step 5: Configuration & Documentation

**Files to Update:**
- `backend/env.example` - Add notification configuration
- `docs/SECURITY_NOTIFICATIONS_SETUP.md` - Setup guide

---

## Implementation Details

### Email Provider Example

```javascript
// emailProvider.js
const nodemailer = require('nodemailer');

async function sendEmailAlert(alert) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO.split(','),
    subject: `[${alert.severity}] Security Alert: ${alert.type}`,
    html: formatAlertEmail(alert),
  };

  await transporter.sendMail(mailOptions);
}
```

### Slack Provider Example

```javascript
// slackProvider.js
const { IncomingWebhook } = require('@slack/webhook');

async function sendSlackAlert(alert) {
  const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);
  
  await webhook.send({
    text: `Security Alert: ${alert.type}`,
    blocks: formatSlackBlocks(alert),
    channel: process.env.SLACK_CHANNEL,
  });
}
```

### Notification Manager Example

```javascript
// notifications/index.js
const emailProvider = require('./emailProvider');
const slackProvider = require('./slackProvider');

async function sendNotifications(alert) {
  const channels = getChannelsForSeverity(alert.severity);
  const promises = [];

  if (channels.includes('email') && process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
    promises.push(emailProvider.sendEmailAlert(alert).catch(err => {
      logger.error('Email notification failed', { error: err.message });
    }));
  }

  if (channels.includes('slack') && process.env.ENABLE_SLACK_NOTIFICATIONS === 'true') {
    promises.push(slackProvider.sendSlackAlert(alert).catch(err => {
      logger.error('Slack notification failed', { error: err.message });
    }));
  }

  await Promise.allSettled(promises);
}
```

## Configuration Guide

### Email Setup (SendGrid Example)

1. **Create SendGrid Account**
   - Sign up at sendgrid.com
   - Verify sender email
   - Generate API key

2. **Configure Environment Variables**
   ```env
   ENABLE_EMAIL_NOTIFICATIONS=true
   EMAIL_SERVICE=sendgrid
   EMAIL_FROM=noreply@trilo.app
   EMAIL_TO=security@trilo.app
   SENDGRID_API_KEY=your_api_key_here
   ```

3. **Install Dependencies**
   ```bash
   cd backend
   npm install @sendgrid/mail
   ```

### Slack Setup

1. **Create Slack Webhook**
   - Go to Slack Workspace Settings
   - Create Incoming Webhook
   - Choose channel (#security-alerts)
   - Copy webhook URL

2. **Configure Environment Variables**
   ```env
   ENABLE_SLACK_NOTIFICATIONS=true
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   SLACK_CHANNEL=#security-alerts
   ```

3. **Install Dependencies**
   ```bash
   cd backend
   npm install @slack/webhook
   ```

## Testing

### Test Email Notifications

1. Trigger a security alert (e.g., 5 failed auth attempts)
2. Check email inbox for alert
3. Verify email format and content
4. Check email delivery logs

### Test Slack Notifications

1. Trigger a security alert
2. Check Slack channel for message
3. Verify message format (blocks, attachments)
4. Test different alert severities

### Integration Testing

1. Disable notifications (set ENABLE_*_NOTIFICATIONS=false)
2. Verify alerts still logged to audit_logs
3. Enable notifications and verify delivery
4. Test error handling (invalid credentials, etc.)

## Success Criteria

- ✅ Email notifications working for all alert types
- ✅ Slack notifications working (if configured)
- ✅ Alert routing based on severity
- ✅ Multiple notification channels supported
- ✅ Notification failures don't break alert logging
- ✅ Configuration is flexible and environment-based
- ✅ Documentation complete
- ✅ Error handling robust

## Future Enhancements

1. **Alert Aggregation**
   - Group similar alerts
   - Send summary reports
   - Reduce notification noise

2. **Alert Tuning**
   - Adjustable thresholds per alert type
   - Per-user alert preferences
   - Alert suppression rules

3. **Dashboard Integration**
   - Real-time alert dashboard
   - Alert history and trends
   - Alert statistics and metrics

4. **Advanced Routing**
   - Route different alert types to different channels
   - Time-based routing (e.g., critical only during business hours)
   - Escalation policies

5. **Monitoring Service Integration**
   - Integrate with Datadog/Sentry/etc.
   - Unified alerting dashboard
   - Advanced alerting rules

## Dependencies

### Required (Phase 1)
- `nodemailer` OR `@sendgrid/mail` (for email)

### Optional (Phase 2)
- `@slack/webhook` OR `@slack/web-api` (for Slack)

### Future (Phase 3)
- Monitoring service SDKs (varies by service)

## Cost Estimate

### Email Notifications
- **SendGrid**: Free tier (100 emails/day), then ~$15/month
- **AWS SES**: $0.10 per 1,000 emails (very cheap)
- **Nodemailer + SMTP**: Varies by SMTP provider

### Slack Notifications
- **Free** (if using existing Slack workspace)

### Monitoring Services
- **Sentry**: Free tier available, then ~$26/month
- **Datadog**: ~$15/month minimum
- **New Relic**: Free tier available, then varies

## Recommendation

**Start with Email Notifications (Phase 1):**
- Quick to implement
- Universal delivery
- Low cost
- Good foundation for future enhancements

**Add Slack (Phase 2) if:**
- Team uses Slack
- Want real-time notifications
- Good for development/staging

**Consider Monitoring Service (Phase 3) when:**
- Application grows
- Need comprehensive monitoring
- Want advanced alerting features
- Have budget for monitoring tools

## References

- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Slack Webhooks](https://api.slack.com/messaging/webhooks)
- [Sentry Alerting](https://docs.sentry.io/product/alerts/)
- [Datadog Alerting](https://docs.datadoghq.com/monitors/)

