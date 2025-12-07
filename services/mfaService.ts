import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';

const MFA_PHONE_STORAGE_KEY = '@trilo:mfa_phone';
const MFA_PHONE_FULL_STORAGE_KEY = '@trilo:mfa_phone_full'; // Encrypted full phone for resending
const MFA_ENABLED_STORAGE_KEY = '@trilo:mfa_enabled';
const MFA_VERIFICATION_ID_STORAGE_KEY = '@trilo:mfa_verification_id';

// Get API base URL (same logic as PlaidContext for consistency)
const getApiBaseUrl = (): string => {
  // Check environment variable first (full URL like https://.../api/plaid)
  if (process.env.EXPO_PUBLIC_PLAID_API_URL) {
    const url = process.env.EXPO_PUBLIC_PLAID_API_URL;
    // Remove /api/plaid if present, otherwise use as-is
    return url.replace('/api/plaid', '');
  }
  
  // Check app.json extra config
  const apiUrl = Constants.expoConfig?.extra?.plaidApiUrl;
  if (apiUrl) {
    // Remove /api/plaid if present to get base URL
    return apiUrl.replace('/api/plaid', '');
  }
  
  // Always use production URL for now (localhost doesn't work in Expo Go on physical devices)
  // For local development with physical devices, use ngrok or similar tunneling service
  return 'https://trilo-production.up.railway.app';
};

const API_BASE_URL = getApiBaseUrl();

export interface MFASetupResult {
  phoneNumber: string;
  maskedPhoneNumber: string;
}

/**
 * Send SMS verification code to phone number
 */
export async function sendSMSVerificationCode(phoneNumber: string, userId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const url = `${API_BASE_URL}/api/mfa/send-code`;
    console.log('[MFA] 📱 Sending SMS code request');
    console.log('[MFA]   URL:', url);
    console.log('[MFA]   API_BASE_URL:', API_BASE_URL);
    console.log('[MFA]   Phone:', phoneNumber);
    console.log('[MFA]   User ID:', userId);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: phoneNumber,
        user_id: userId,
      }),
    });

    console.log('[MFA] 📡 Response received');
    console.log('[MFA]   Status:', response.status);
    console.log('[MFA]   OK:', response.ok);
    console.log('[MFA]   Status Text:', response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[MFA] ❌ Error response body:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'Failed to send verification code' };
      }
      
      const errorMessage = errorData.error || errorData.message || `Server error: ${response.status}`;
      console.error('[MFA] ❌ Error message:', errorMessage);
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Store verification ID for later verification
    if (data.verification_id) {
      await AsyncStorage.setItem(`${MFA_VERIFICATION_ID_STORAGE_KEY}_${userId}`, data.verification_id);
    }
    
    // Store phone number (masked for display and full for resending)
    const maskedPhone = maskPhoneNumber(phoneNumber);
    await AsyncStorage.setItem(`${MFA_PHONE_STORAGE_KEY}_${userId}`, maskedPhone);
    // Store full phone number (for resending codes) - in production, encrypt this
    await AsyncStorage.setItem(`${MFA_PHONE_FULL_STORAGE_KEY}_${userId}`, phoneNumber);

    return { success: true, message: data.message || 'Verification code sent' };
  } catch (error) {
    console.error('[MFA] ❌ Error sending SMS verification code:', error);
    
    // Provide more helpful error messages
    let errorMessage = 'Failed to send verification code';
    
    if (error instanceof Error) {
      if (error.message.includes('Network request failed') || error.message.includes('fetch failed')) {
        errorMessage = 'Network error. Please check your internet connection and ensure the backend server is running.';
        console.error('[MFA] 💡 Tip: If using localhost, ensure backend is running and use production URL for physical devices.');
      } else if (error.message.includes('Route not found') || error.message.includes('404')) {
        errorMessage = 'MFA service is not available yet. The backend routes need to be deployed. This is a one-time setup.';
        console.error('[MFA] 💡 Backend route /api/mfa/send-code not found. Deploy backend with MFA routes to Railway.');
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Verify SMS code
 */
export async function verifySMSCode(
  userId: string,
  code: string,
  phoneNumber?: string
): Promise<boolean> {
  try {
    // Get verification ID from storage
    const verificationId = await AsyncStorage.getItem(`${MFA_VERIFICATION_ID_STORAGE_KEY}_${userId}`);
    
    if (!verificationId) {
      console.error('No verification ID found');
      return false;
    }

    // Get phone number if not provided
    const phone = phoneNumber || await AsyncStorage.getItem(`${MFA_PHONE_STORAGE_KEY}_${userId}`);
    
    if (!phone) {
      console.error('No phone number found');
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/api/mfa/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        verification_id: verificationId,
        code: code.trim(),
        user_id: userId,
        phone_number: phone,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Verification failed' }));
      console.error('Verification failed:', errorData);
      return false;
    }

    const data = await response.json();
    return data.verified === true;
  } catch (error) {
    console.error('Error verifying SMS code:', error);
    return false;
  }
}

/**
 * Mask phone number for display
 */
function maskPhoneNumber(phoneNumber: string): string {
  // Remove all non-digits
  const digits = phoneNumber.replace(/\D/g, '');
  
  if (digits.length >= 10) {
    // Show last 4 digits, mask the rest
    const last4 = digits.slice(-4);
    const masked = '*'.repeat(Math.max(0, digits.length - 4));
    return `+${masked}${last4}`;
  }
  
  return phoneNumber;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, '');
  
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  
  return phoneNumber;
}

/**
 * Check if MFA is enabled for a user
 */
export async function isMFAEnabled(userId: string): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(`${MFA_ENABLED_STORAGE_KEY}_${userId}`);
    return enabled === 'true';
  } catch (error) {
    console.error('Error checking MFA status:', error);
    return false;
  }
}

/**
 * Enable MFA for a user (after successful setup)
 */
export async function enableMFA(userId: string, phoneNumber: string): Promise<void> {
  try {
    await AsyncStorage.setItem(`${MFA_ENABLED_STORAGE_KEY}_${userId}`, 'true');
    
    // Store masked phone number for display
    const maskedPhone = maskPhoneNumber(phoneNumber);
    await AsyncStorage.setItem(`${MFA_PHONE_STORAGE_KEY}_${userId}`, maskedPhone);
    // Store full phone number for resending (in production, encrypt this)
    await AsyncStorage.setItem(`${MFA_PHONE_FULL_STORAGE_KEY}_${userId}`, phoneNumber);
    
    // Update Supabase user metadata
    const { error } = await supabase.auth.updateUser({
      data: { 
        mfa_enabled: true, 
        mfa_enabled_at: new Date().toISOString(),
        mfa_phone: maskedPhone, // Store masked phone in metadata for display
        mfa_phone_full: phoneNumber, // Store full phone in metadata for resending (backend has access)
      }
    });
    
    if (error) {
      console.warn('Failed to update user metadata with MFA status:', error);
    }
  } catch (error) {
    console.error('Error enabling MFA:', error);
    throw error;
  }
}

/**
 * Disable MFA for a user
 */
export async function disableMFA(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${MFA_ENABLED_STORAGE_KEY}_${userId}`);
    await AsyncStorage.removeItem(`${MFA_PHONE_STORAGE_KEY}_${userId}`);
    await AsyncStorage.removeItem(`${MFA_PHONE_FULL_STORAGE_KEY}_${userId}`);
    await AsyncStorage.removeItem(`${MFA_VERIFICATION_ID_STORAGE_KEY}_${userId}`);
    
    // Update Supabase user metadata
    const { error } = await supabase.auth.updateUser({
      data: { mfa_enabled: false, mfa_phone: null, mfa_phone_full: null }
    });
    
    if (error) {
      console.warn('Failed to update user metadata with MFA status:', error);
    }
  } catch (error) {
    console.error('Error disabling MFA:', error);
    throw error;
  }
}

/**
 * Get the stored phone number for a user (masked)
 */
export async function getMFAPhoneNumber(userId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(`${MFA_PHONE_STORAGE_KEY}_${userId}`);
  } catch (error) {
    console.error('Error getting MFA phone number:', error);
    return null;
  }
}

/**
 * Resend SMS verification code
 * Note: This requires the full phone number to be stored in backend or encrypted locally
 * For now, we'll fetch it from user metadata
 */
export async function resendSMSCode(userId: string): Promise<{ success: boolean; message?: string }> {
  try {
    // Get full phone number from storage (we stored it during setup)
    const phoneNumber = await AsyncStorage.getItem(`${MFA_PHONE_FULL_STORAGE_KEY}_${userId}`);
    
    if (!phoneNumber) {
      // Fallback: try to get from user metadata
      const { data: { user } } = await supabase.auth.getUser();
      const metadataPhone = user?.user_metadata?.mfa_phone_full;
      
      if (!metadataPhone) {
        return { success: false, message: 'No phone number found. Please set up MFA again.' };
      }
      
      // Use metadata phone and store it locally
      await AsyncStorage.setItem(`${MFA_PHONE_FULL_STORAGE_KEY}_${userId}`, metadataPhone);
      
      // Remove old verification ID to force new code
      await AsyncStorage.removeItem(`${MFA_VERIFICATION_ID_STORAGE_KEY}_${userId}`);
      
      // Send new code
      return await sendSMSVerificationCode(metadataPhone, userId);
    }

    // Remove old verification ID to force new code
    await AsyncStorage.removeItem(`${MFA_VERIFICATION_ID_STORAGE_KEY}_${userId}`);
    
    // Send new code
    return await sendSMSVerificationCode(phoneNumber, userId);
  } catch (error) {
    console.error('Error resending SMS code:', error);
    return { success: false, message: 'Failed to resend code' };
  }
}
