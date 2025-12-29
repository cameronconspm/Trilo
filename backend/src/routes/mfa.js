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
  // #region agent log
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  fetch('http://127.0.0.1:7242/ingest/fd030542-01b4-4fd0-bef5-1587e412ee0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mfa.js:24',message:'Code generated',data:{code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'5'})}).catch(()=>{});
  // #endregion
  return code;
}

/**
 * Send SMS verification code
 * Supports Twilio (recommended) or logs to console in development
 */
async function sendSMS(phoneNumber, code) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/fd030542-01b4-4fd0-bef5-1587e412ee0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mfa.js:31',message:'sendSMS called',data:{phoneNumber,code,hasTwilioSid:!!process.env.TWILIO_ACCOUNT_SID,hasTwilioToken:!!process.env.TWILIO_AUTH_TOKEN,hasTwilioPhone:!!process.env.TWILIO_PHONE_NUMBER},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'1,2'})}).catch(()=>{});
  // #endregion
  // Check if Twilio is configured
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd030542-01b4-4fd0-bef5-1587e412ee0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mfa.js:35',message:'Attempting Twilio send',data:{phoneNumber,code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'1,2'})}).catch(()=>{});
      // #endregion
      // Dynamically import Twilio (install with: npm install twilio)
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      await client.messages.create({
        body: `Your Trilo verification code is: ${code}. This code expires in 10 minutes.`,
        to: phoneNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd030542-01b4-4fd0-bef5-1587e412ee0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mfa.js:45',message:'Twilio SMS sent successfully',data:{phoneNumber},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'1,2'})}).catch(()=>{});
      // #endregion
      console.log(`[MFA] SMS code sent to ${phoneNumber} via Twilio`);
      return true;
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd030542-01b4-4fd0-bef5-1587e412ee0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mfa.js:48',message:'Twilio send failed',data:{error:error.message,errorName:error.name,phoneNumber},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'1,2,6'})}).catch(()=>{});
      // #endregion
      console.error('[MFA] Error sending SMS via Twilio:', error);
      // Fall through to logging for debugging
    }
  }
  
  // Development/fallback: Log the code to console
  // ⚠️ REMOVE THIS IN PRODUCTION OR WHEN SMS SERVICE IS CONFIGURED
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/fd030542-01b4-4fd0-bef5-1587e412ee0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mfa.js:55',message:'Falling back to console logging',data:{phoneNumber,code,reason:'Twilio not configured'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'1,2'})}).catch(()=>{});
  // #endregion
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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/fd030542-01b4-4fd0-bef5-1587e412ee0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mfa.js:66',message:'send-code route called',data:{phone_number:req.body.phone_number,user_id:req.body.user_id,bodyKeys:Object.keys(req.body)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'3,4'})}).catch(()=>{});
  // #endregion
  try {
    const { phone_number, user_id } = req.body;

    if (!phone_number || !user_id) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd030542-01b4-4fd0-bef5-1587e412ee0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mfa.js:70',message:'Missing required fields',data:{hasPhone:!!phone_number,hasUserId:!!user_id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'4'})}).catch(()=>{});
      // #endregion
      return res.status(400).json({ error: 'Phone number and user ID are required' });
    }

    // Validate phone number format (basic check)
    const phoneDigits = phone_number.replace(/\D/g, '');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fd030542-01b4-4fd0-bef5-1587e412ee0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mfa.js:75',message:'Phone validation',data:{phone_number,phoneDigits,digitLength:phoneDigits.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'4'})}).catch(()=>{});
    // #endregion
    if (phoneDigits.length < 10) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd030542-01b4-4fd0-bef5-1587e412ee0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mfa.js:77',message:'Invalid phone format',data:{phoneDigits,digitLength:phoneDigits.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'4'})}).catch(()=>{});
      // #endregion
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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fd030542-01b4-4fd0-bef5-1587e412ee0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mfa.js:87',message:'Code stored in memory',data:{key,verificationId,code,storedByKey:verificationCodes.has(key),storedById:verificationCodes.has(`id_${verificationId}`)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'5'})}).catch(()=>{});
    // #endregion

    // Send SMS (in production, this would actually send SMS)
    await sendSMS(phone_number, code);

    console.log(`[MFA] Verification code sent to ${phone_number} for user ${user_id}`);
    console.log(`[MFA] ⚠️  Code: ${code} (remove this log in production!)`);

    res.json({
      success: true,
      message: 'Verification code sent',
      verification_id: verificationId,
      // Return code if Twilio is not configured (for development/testing)
      // In production with Twilio configured, code will be sent via SMS
      ...((!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) && { code }), // Return code when SMS service not configured
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

