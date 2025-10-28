/**
 * RevenueCat Webhook Handler
 * 
 * This webhook receives events from RevenueCat when subscription status changes
 * and updates the Supabase database accordingly.
 * 
 * Setup:
 * 1. In RevenueCat dashboard, go to Project Settings > Integrations > Webhooks
 * 2. Add a webhook URL pointing to this endpoint
 * 3. Enable events: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `UNSUBSCRIBE`
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// Verify webhook signature (optional but recommended)
function verifyWebhookSignature(req, secret) {
  // Implement signature verification
  // See: https://www.revenuecat.com/docs/webhooks
  return true;
}

router.post('/revenuecat', async (req, res) => {
  try {
    // Verify webhook signature
    const isValid = verifyWebhookSignature(req, process.env.REVENUECAT_WEBHOOK_SECRET);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    const { event_type, app_user_id, entitlement_ids } = event;

    // Find user by RevenueCat app_user_id
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('revenuecat_user_id', app_user_id)
      .single();

    if (error || !subscription) {
      console.error('User not found for RevenueCat ID:', app_user_id);
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = subscription.user_id;

    switch (event_type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
        // User purchased or renewed - set to active
        await supabase
          .from('user_subscriptions')
          .update({
            status: 'active',
            subscription_expires_at: event.expiration_at_ms
              ? new Date(event.expiration_at_ms).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        console.log(`✅ Subscription activated for user ${userId}`);
        break;

      case 'CANCELLATION':
      case 'UNSUBSCRIBE':
        // User cancelled - set to expired
        await supabase
          .from('user_subscriptions')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        console.log(`❌ Subscription expired for user ${userId}`);
        break;

      default:
        console.log(`Ignoring event type: ${event_type}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

