const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const supabase = require('../config/supabase');

// In-memory store for verification codes (in production, use Redis or database)
// Format: { userId_phone: { code: string, expiresAt: number, attempts: number } }
const verificationCodes = new Map();

// Clean up expired codes every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of verificationCodes.entries()) {
    if (value.expiresAt < now) {
      verificationCodes.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Generate a random 6-digit code
 */
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send SMS verification code
 * Supports Twilio (recommended) or logs to console in development
 */
async function sendSMS(phoneNumber, code) {
  // Check if Twilio is configured
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      // Dynamically import Twilio (install with: npm install twilio)
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      await client.messages.create({
        body: `Your Trilo verification code is: ${code}. This code expires in 10 minutes.`,
        to: phoneNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
      });
      
      console.log(`[MFA] SMS code sent to ${phoneNumber} via Twilio`);
      return true;
    } catch (error) {
      console.error('[MFA] Error sending SMS via Twilio:', error);
      // Fall through to logging for debugging
    }
  }
  
  // Development/fallback: Log the code to console
  // ⚠️ REMOVE THIS IN PRODUCTION OR WHEN SMS SERVICE IS CONFIGURED
  console.log(`[MFA] ⚠️  SMS Code for ${phoneNumber}: ${code}`);
  console.log('[MFA] ⚠️  SMS sending not configured - code logged above');
  console.log('[MFA] ⚠️  To enable SMS: Install Twilio and set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER');
  
  return true;
}

/**
 * POST /api/mfa/send-code
 * Send SMS verification code to phone number
 */
router.post('/send-code', async (req, res) => {
  try {
    const { phone_number, user_id } = req.body;

    if (!phone_number || !user_id) {
      return res.status(400).json({ error: 'Phone number and user ID are required' });
    }

    // Validate phone number format (basic check)
    const phoneDigits = phone_number.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    const verificationId = crypto.randomBytes(16).toString('hex');

    // Store verification code
    const key = `${user_id}_${phone_number}`;
    verificationCodes.set(key, {
      code,
      expiresAt,
      attempts: 0,
      verificationId,
      phoneNumber: phone_number,
    });

    // Store by verification ID for lookup
    verificationCodes.set(`id_${verificationId}`, {
      code,
      expiresAt,
      attempts: 0,
      userId: user_id,
      phoneNumber: phone_number,
    });

    // Send SMS (in production, this would actually send SMS)
    await sendSMS(phone_number, code);

    console.log(`[MFA] Verification code sent to ${phone_number} for user ${user_id}`);
    console.log(`[MFA] ⚠️  Code: ${code} (remove this log in production!)`);

    res.json({
      success: true,
      message: 'Verification code sent',
      verification_id: verificationId,
      // Don't send code in production response
      ...(process.env.NODE_ENV === 'development' && { code }), // Only in dev mode
    });
  } catch (error) {
    console.error('[MFA] Error sending verification code:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

/**
 * POST /api/mfa/verify-code
 * Verify SMS code
 */
router.post('/verify-code', async (req, res) => {
  try {
    const { verification_id, code, user_id, phone_number } = req.body;

    if (!verification_id || !code || !user_id) {
      return res.status(400).json({ error: 'Verification ID, code, and user ID are required' });
    }

    // Look up verification by ID
    const stored = verificationCodes.get(`id_${verification_id}`);

    if (!stored) {
      return res.status(400).json({ verified: false, error: 'Invalid verification ID' });
    }

    // Check if expired
    if (stored.expiresAt < Date.now()) {
      verificationCodes.delete(`id_${verification_id}`);
      return res.status(400).json({ verified: false, error: 'Verification code expired' });
    }

    // Check attempt limit (prevent brute force)
    if (stored.attempts >= 5) {
      verificationCodes.delete(`id_${verification_id}`);
      return res.status(400).json({ verified: false, error: 'Too many attempts. Please request a new code.' });
    }

    stored.attempts += 1;

    // Verify code
    if (stored.code === code.trim()) {
      // Code is correct - clean up
      verificationCodes.delete(`id_${verification_id}`);
      
      // Also clean up by user_id_phone key
      const key = `${stored.userId}_${stored.phoneNumber}`;
      verificationCodes.delete(key);

      // Update user metadata in Supabase (optional)
      try {
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          stored.userId,
          {
            user_metadata: {
              mfa_enabled: true,
              mfa_enabled_at: new Date().toISOString(),
              mfa_phone: stored.phoneNumber,
            },
          }
        );

        if (updateError) {
          console.warn('[MFA] Failed to update user metadata:', updateError);
          // Don't fail verification if metadata update fails
        }
      } catch (metadataError) {
        console.warn('[MFA] Error updating user metadata:', metadataError);
      }

      console.log(`[MFA] Verification successful for user ${stored.userId}`);
      res.json({ verified: true });
    } else {
      // Code is incorrect
      console.log(`[MFA] Verification failed for user ${stored.userId} (attempt ${stored.attempts}/5)`);
      res.status(400).json({ verified: false, error: 'Invalid verification code' });
    }
  } catch (error) {
    console.error('[MFA] Error verifying code:', error);
    res.status(500).json({ verified: false, error: 'Failed to verify code' });
  }
});

module.exports = router;

