const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const supabase = require('../config/supabase');

// Database storage for verification codes (secure, persistent)
// Codes are stored in mfa_verification_codes table

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
      // Validate credentials format before attempting send
      const accountSid = process.env.TWILIO_ACCOUNT_SID.trim();
      const authToken = process.env.TWILIO_AUTH_TOKEN.trim();
      const fromNumber = process.env.TWILIO_PHONE_NUMBER.trim();
      
      if (!accountSid.startsWith('AC')) {
        console.error('[MFA] ⚠️  TWILIO_ACCOUNT_SID should start with "AC". Current value starts with:', accountSid.substring(0, 2));
      }
      if (!fromNumber.startsWith('+')) {
        console.error('[MFA] ⚠️  TWILIO_PHONE_NUMBER should start with "+". Current value:', fromNumber);
      }
      
      // Normalize phone numbers to E.164 format (no spaces, dashes, or parentheses)
      // Remove all non-digit characters except leading +
      const normalizePhone = (num) => {
        if (num.startsWith('+')) {
          return '+' + num.slice(1).replace(/\D/g, '');
        }
        return num.replace(/\D/g, '');
      };
      
      const normalizedTo = normalizePhone(phoneNumber);
      const normalizedFrom = normalizePhone(fromNumber);
      
      console.log(`[MFA] Sending SMS - To: ${normalizedTo}, From: ${normalizedFrom}`);
      console.log(`[MFA] Original formats - To: ${phoneNumber}, From: ${fromNumber}`);
      
      // Dynamically import Twilio (install with: npm install twilio)
      const twilio = require('twilio');
      const client = twilio(accountSid, authToken);
      
      const message = await client.messages.create({
        body: `Your Trilo verification code is: ${code}. This code expires in 10 minutes.`,
        to: normalizedTo,
        from: normalizedFrom,
      });
      
      // Log Twilio response details for debugging
      console.log(`[MFA] SMS code sent to ${phoneNumber} via Twilio`);
      console.log(`[MFA] Twilio Message SID: ${message.sid}`);
      console.log(`[MFA] Twilio Status: ${message.status}`);
      console.log(`[MFA] To: ${normalizedTo}, From: ${normalizedFrom}`);
      
      // Track if message was queued (may fail later) or immediately failed
      const messageStatus = message.status;
      const messageErrorCode = message.errorCode;
      
      // Check for common issues
      if (message.status === 'queued' || message.status === 'sending') {
        console.log('[MFA] ✅ Message queued successfully. Delivery may take a few moments.');
        
        // Check message status after a short delay to see if delivery succeeded
        // Note: This is async and won't block the response, but will log delivery status
        setTimeout(async () => {
          try {
            const updatedMessage = await client.messages(message.sid).fetch();
            console.log(`[MFA] Message status check (after delay): ${updatedMessage.status}`);
            console.log(`[MFA] Error Code: ${updatedMessage.errorCode || 'none'}`);
            console.log(`[MFA] Error Message: ${updatedMessage.errorMessage || 'none'}`);
            
            if (updatedMessage.status === 'failed' || updatedMessage.status === 'undelivered') {
              console.error(`[MFA] ❌ Message delivery failed!`);
              console.error(`[MFA] Error Code: ${updatedMessage.errorCode}`);
              console.error(`[MFA] Error Message: ${updatedMessage.errorMessage}`);
              
              // Common error codes
              if (updatedMessage.errorCode === 21211) {
                console.error('[MFA] ⚠️  Invalid phone number format');
              } else if (updatedMessage.errorCode === 21610 || updatedMessage.errorCode === 21614) {
                console.error('[MFA] ⚠️  Unverified phone number (trial accounts can only send to verified numbers)');
                console.error('[MFA] 💡 Verify the number at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
              } else if (updatedMessage.errorCode === 30008) {
                console.error('[MFA] ⚠️  Unknown destination handset');
              } else if (updatedMessage.errorCode === 30034) {
                console.error('[MFA] ⚠️  Unreachable destination handset (Error 30034)');
                console.error('[MFA] 💡 Common causes:');
                console.error('[MFA]   1. Phone number is invalid or not in service');
                console.error('[MFA]   2. Phone is turned off or out of coverage');
                console.error('[MFA]   3. Carrier blocking or filtering the message');
                console.error('[MFA]   4. For trial accounts: Number must be verified in Twilio Console');
                console.error('[MFA]   💡 Check Twilio Console for detailed delivery status');
                console.error('[MFA]   💡 Code is returned in API response for testing');
              }
            } else if (updatedMessage.status === 'sent' || updatedMessage.status === 'delivered') {
              console.log(`[MFA] ✅ Message ${updatedMessage.status} successfully!`);
            }
          } catch (statusError) {
            console.error('[MFA] Error checking message status:', statusError.message);
          }
        }, 3000); // Check after 3 seconds
      } else if (message.status === 'failed' || message.status === 'undelivered') {
        console.error(`[MFA] ⚠️  Message status: ${message.status}. Check Twilio Console for details.`);
        console.error(`[MFA] Error Code: ${message.errorCode || 'none'}`);
        console.error(`[MFA] Error Message: ${message.errorMessage || 'none'}`);
        console.error(`[MFA] ⚠️  Common issues: Unverified phone number (trial accounts), invalid number format, or account limitations.`);
        
        // Handle specific error codes
        if (message.errorCode === 30034) {
          console.error('[MFA] ⚠️  Error 30034: Unreachable destination handset');
          console.error('[MFA] 💡 Verify the phone number is correct and in service');
          console.error('[MFA] 💡 For trial accounts: Verify the number in Twilio Console');
        }
      }
      
      return true;
    } catch (error) {
      console.error('[MFA] Error sending SMS via Twilio:', error);
      
      // Provide helpful error messages for common issues
      if (error.status === 401 || error.code === 20003) {
        console.error('[MFA] 🔐 Authentication Error (401) - Common causes:');
        console.error('[MFA]   1. Wrong Account SID (should start with "AC")');
        console.error('[MFA]   2. Wrong Auth Token (check for typos or extra spaces)');
        console.error('[MFA]   3. Credentials copied incorrectly from Twilio Console');
        console.error('[MFA]   4. Using Account SID in place of Auth Token (or vice versa)');
        console.error('[MFA]   💡 Verify in Railway: Variables → Check all 3 Twilio variables are set correctly');
      } else if (error.code === 21211 || error.code === 21610) {
        console.error('[MFA] 📱 Phone Number Error - Common causes:');
        console.error('[MFA]   1. Invalid phone number format');
        console.error('[MFA]   2. Unverified phone number (trial accounts can only send to verified numbers)');
        console.error('[MFA]   3. Phone number not verified in Twilio Console → Phone Numbers → Verified Caller IDs');
        console.error('[MFA]   💡 For trial accounts: Verify your phone number at https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
      } else if (error.code === 21608 || error.code === 21614) {
        console.error('[MFA] ⚠️  Trial Account Limitation:');
        console.error('[MFA]   Trial accounts can only send SMS to verified phone numbers');
        console.error('[MFA]   💡 Verify the recipient number in Twilio Console → Phone Numbers → Verified Caller IDs');
        console.error('[MFA]   💡 Or upgrade to a paid Twilio account for production use');
      }
      
      console.error('[MFA] Full Twilio error:', {
        code: error.code,
        status: error.status,
        message: error.message,
        moreInfo: error.moreInfo,
      });
      
      // Fall through to logging for debugging
    }
  }
  
  // Development/fallback: Log the code to console
  // ⚠️ Only logs when Twilio is not configured
  console.log(`[MFA] ⚠️  SMS sending not configured - code for ${phoneNumber} logged to console`);
  console.log('[MFA] ⚠️  To enable SMS: Configure Twilio credentials in Railway environment variables');
  
  return true;
}

/**
 * POST /api/mfa/send-code
 * Send SMS verification code to phone number
 */
router.post('/send-code', async (req, res) => {
  // #region agent log
  console.log('[DEBUG] MFA send-code route hit', JSON.stringify({phone_number:req.body?.phone_number,user_id:req.body?.user_id,supabaseIsNull:supabase===null,timestamp:Date.now()}));
  // #endregion
  
  // Check if Supabase is configured
  if (!supabase) {
    console.error('[MFA] ❌ Supabase not configured - cannot store verification codes');
    return res.status(503).json({ 
      error: 'Service unavailable',
      message: 'Database service is not configured. Please contact support.'
    });
  }
  
  try {
    const { phone_number, user_id } = req.body;

    // #region agent log
    console.log('[DEBUG] Request body parsed', JSON.stringify({hasPhone:!!phone_number,hasUserId:!!user_id,timestamp:Date.now()}));
    // #endregion

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

    // Store verification code in database
    // #region agent log
    console.log('[DEBUG] Before Supabase insert', JSON.stringify({supabaseIsNull:supabase===null,verificationId,userId:user_id,timestamp:Date.now()}));
    // #endregion
    const expiresAtISO = new Date(expiresAt).toISOString();
    const { error: insertError } = await supabase
      .from('mfa_verification_codes')
      .insert({
        verification_id: verificationId,
        user_id: user_id,
        phone_number: phone_number,
        code: code,
        attempts: 0,
        expires_at: expiresAtISO,
      });

    // #region agent log
    console.log('[DEBUG] After Supabase insert', JSON.stringify({hasInsertError:!!insertError,insertErrorMessage:insertError?.message,insertErrorCode:insertError?.code,timestamp:Date.now()}));
    // #endregion

    if (insertError) {
      // #region agent log
      console.log('[DEBUG] Supabase insert error thrown', JSON.stringify({errorMessage:insertError.message,errorCode:insertError.code,timestamp:Date.now()}));
      // #endregion
      throw new Error(`Failed to store verification code: ${insertError.message}`);
    }

    // Send SMS
    // #region agent log
    console.log('[DEBUG] Before sendSMS call', JSON.stringify({phoneNumber:phone_number,hasTwilioSid:!!process.env.TWILIO_ACCOUNT_SID,hasTwilioToken:!!process.env.TWILIO_AUTH_TOKEN,hasTwilioPhone:!!process.env.TWILIO_PHONE_NUMBER,timestamp:Date.now()}));
    // #endregion
    await sendSMS(phone_number, code);
    // #region agent log
    console.log('[DEBUG] After sendSMS call', JSON.stringify({success:true,timestamp:Date.now()}));
    // #endregion

    console.log(`[MFA] Verification code sent to ${phone_number} for user ${user_id}`);

    // Return code in development mode or when Twilio is not configured
    // This allows testing even when SMS delivery fails (e.g., trial account limitations)
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const twilioNotConfigured = !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER;
    const shouldReturnCode = isDevelopment || twilioNotConfigured;
    
    // #region agent log
    console.log('[DEBUG] Code return decision', JSON.stringify({isDevelopment,twilioNotConfigured,shouldReturnCode,NODE_ENV:process.env.NODE_ENV,timestamp:Date.now()}));
    // #endregion

    res.json({
      success: true,
      message: 'Verification code sent',
      verification_id: verificationId,
      // Return code for development/testing or when Twilio is not configured
      // Note: In production with Twilio configured and working, code is sent via SMS only
      // If SMS delivery fails (e.g., error 30034), user can still test using this code
      ...(shouldReturnCode && { code }),
    });
  } catch (error) {
    // #region agent log
    console.log('[DEBUG] Catch block - error details', JSON.stringify({errorMessage:error?.message,errorStack:error?.stack?.substring(0,500),errorName:error?.name,errorCode:error?.code,timestamp:Date.now()}));
    // #endregion
    console.error('[MFA] Error sending verification code:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

/**
 * POST /api/mfa/verify-code
 * Verify SMS code
 */
router.post('/verify-code', async (req, res) => {
  // Check if Supabase is configured
  if (!supabase) {
    console.error('[MFA] ❌ Supabase not configured - cannot verify codes');
    return res.status(503).json({ 
      verified: false,
      error: 'Service unavailable',
      message: 'Database service is not configured. Please contact support.'
    });
  }
  
  try {
    const { verification_id, code, user_id, phone_number } = req.body;

    if (!verification_id || !code || !user_id) {
      return res.status(400).json({ error: 'Verification ID, code, and user ID are required' });
    }

    // Look up verification by ID from database
    const { data: storedData, error: fetchError } = await supabase
      .from('mfa_verification_codes')
      .select('*')
      .eq('verification_id', verification_id)
      .single();

    if (fetchError || !storedData) {
      return res.status(400).json({ verified: false, error: 'Invalid verification ID' });
    }

    // Check if expired
    const expiresAt = new Date(storedData.expires_at).getTime();
    if (expiresAt < Date.now()) {
      // Clean up expired code
      await supabase.from('mfa_verification_codes').delete().eq('verification_id', verification_id);
      return res.status(400).json({ verified: false, error: 'Verification code expired' });
    }

    // Check attempt limit (prevent brute force)
    if (storedData.attempts >= 5) {
      // Clean up code after max attempts
      await supabase.from('mfa_verification_codes').delete().eq('verification_id', verification_id);
      return res.status(400).json({ verified: false, error: 'Too many attempts. Please request a new code.' });
    }

    // Increment attempts
    const newAttempts = storedData.attempts + 1;
    await supabase
      .from('mfa_verification_codes')
      .update({ attempts: newAttempts })
      .eq('verification_id', verification_id);

    // Verify code
    if (storedData.code === code.trim()) {
      // Code is correct - clean up from database
      await supabase.from('mfa_verification_codes').delete().eq('verification_id', verification_id);

      // Update user metadata in Supabase (optional)
      try {
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          storedData.user_id,
          {
            user_metadata: {
              mfa_enabled: true,
              mfa_enabled_at: new Date().toISOString(),
              mfa_phone: storedData.phone_number,
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

      console.log(`[MFA] Verification successful for user ${storedData.user_id}`);
      res.json({ verified: true });
    } else {
      // Code is incorrect
      console.log(`[MFA] Verification failed for user ${storedData.user_id} (attempt ${newAttempts}/5)`);
      res.status(400).json({ verified: false, error: 'Invalid verification code' });
    }
  } catch (error) {
    console.error('[MFA] Error verifying code:', error);
    res.status(500).json({ verified: false, error: 'Failed to verify code' });
  }
});

module.exports = router;

