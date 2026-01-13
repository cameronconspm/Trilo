import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePlaid, PlaidLinkMetadata } from '@/context/PlaidContext';

// Import the new Plaid SDK API (v11.6.0+)
import { create, open, destroy, dismissLink, usePlaidEmitter, LinkIOSPresentationStyle, LinkLogLevel } from 'react-native-plaid-link-sdk';
import type { LinkSuccess, LinkExit, LinkEvent } from 'react-native-plaid-link-sdk';

// Diagnostic storage key
const DIAGNOSTICS_STORAGE_KEY = '@trilo:plaid_diagnostics';

// SDK availability check
let SDKAvailable = false;
let SDKLoadError: Error | null = null;

try {
  // Try to import the SDK to check if it's available
  require('react-native-plaid-link-sdk');
  SDKAvailable = true;
  console.log('[Plaid] ✅ Plaid SDK module is available');
} catch (error) {
  SDKAvailable = false;
  SDKLoadError = error as Error;
  console.error('[Plaid] ❌ Plaid SDK module not available:', error);
}

/**
 * Check if we're running in Expo Go (which doesn't support native modules)
 */
function isRunningInExpoGoEarly(): boolean {
  return (
    Constants.executionEnvironment === 'storeClient' ||
    Constants.appOwnership === 'expo'
  );
}

/**
 * Capture and store diagnostic information
 */
async function storeDiagnostics(diagnostics: any): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    const diagnosticData = {
      timestamp,
      ...diagnostics,
    };
    await AsyncStorage.setItem(DIAGNOSTICS_STORAGE_KEY, JSON.stringify(diagnosticData));
    console.log('[Plaid] 📊 Diagnostics stored');
  } catch (error) {
    console.error('[Plaid] Failed to store diagnostics:', error);
  }
}

/**
 * Get stored diagnostic information
 */
export async function getStoredDiagnostics(): Promise<any | null> {
  try {
    const data = await AsyncStorage.getItem(DIAGNOSTICS_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('[Plaid] Failed to get diagnostics:', error);
    return null;
  }
}

/**
 * Log comprehensive diagnostic information
 * Always logs in production for troubleshooting
 */
function logDiagnostics(additionalInfo?: any): void {
  const diagnostics = {
    platform: Platform.OS,
    executionEnvironment: Constants.executionEnvironment,
    appOwnership: Constants.appOwnership,
    isDevice: Constants.isDevice,
    isDev: __DEV__,
    sdkAvailable: SDKAvailable,
    sdkLoadError: SDKLoadError ? {
      message: SDKLoadError.message,
      name: SDKLoadError.name,
    } : null,
    isExpoGo: isRunningInExpoGoEarly(),
    reactNativeVersion: Platform.constants?.reactNativeVersion
      ? `${Platform.constants.reactNativeVersion.major}.${Platform.constants.reactNativeVersion.minor}.${Platform.constants.reactNativeVersion.patch}`
      : 'Unknown',
    ...additionalInfo,
  };

  // Always log diagnostics
  console.log('[Plaid] 📊 Diagnostics:', JSON.stringify(diagnostics, null, 2));
  
  // Store diagnostics for later retrieval
  storeDiagnostics(diagnostics);
}

interface PlaidLinkComponentProps {
  onSuccess?: (publicToken: string, metadata: PlaidLinkMetadata) => void;
  onExit?: (error: any) => void;
  onEvent?: (event: any) => void;
}

// Internal component that safely uses usePlaidEmitter
function PlaidLinkComponentInner({
  onSuccess,
  onExit,
  onEvent,
}: PlaidLinkComponentProps) {
  const { state, handlePlaidSuccess, handlePlaidExit, dispatch } = usePlaid();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const linkCreatedRef = useRef(false);

  // Use Plaid event emitter for onEvent callbacks
  // This component only renders when SDK is available, so it's safe to call
  usePlaidEmitter((event: LinkEvent) => {
    console.log('[Plaid] 📊 Link Event:', JSON.stringify(event, null, 2));
    onEvent?.(event);
  });

  // Handle Plaid Link success
  const handleSuccess = useCallback(async (success: LinkSuccess) => {
    try {
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      console.log('[Plaid] 🎉 Link Success');
      console.log('[Plaid]   Public Token:', success.publicToken?.substring(0, 20) + '...');
      console.log('[Plaid]   Institution:', success.metadata?.institution?.name || 'Unknown');
      // Note: institution_id may not be available in all SDK versions
      // console.log('[Plaid]   Institution ID:', success.metadata?.institution?.institution_id || 'Unknown');
      console.log('[Plaid]   Accounts:', success.metadata?.accounts?.length || 0);

      if (success.metadata?.accounts) {
        success.metadata.accounts.forEach((account, index) => {
          console.log(`[Plaid]   Account ${index + 1}:`, {
            id: account.id,
            name: account.name,
            type: account.type,
            subtype: account.subtype,
            mask: account.mask,
          });
        });
      }

      // Convert LinkSuccess to our PlaidLinkMetadata format
      const metadata: PlaidLinkMetadata = {
        institution: success.metadata?.institution ? {
          name: success.metadata.institution.name || '',
          institution_id: (success.metadata.institution as any).institution_id || '',
        } : undefined,
        accounts: success.metadata?.accounts?.map(account => ({
          id: account.id,
          name: account.name || '',
          type: String(account.type),
          subtype: account.subtype ? String(account.subtype) : undefined,
          mask: account.mask || '',
        })).filter(acc => acc.name && acc.mask) || [],
      };

      // Store success diagnostics
      await storeDiagnostics({
        lastSuccess: {
          timestamp: new Date().toISOString(),
          institution: metadata.institution?.name,
          institutionId: metadata.institution?.institution_id,
          accountCount: metadata.accounts?.length || 0,
        },
      });

      // Call context handler with public token
      if (success.publicToken) {
        await handlePlaidSuccess(success.publicToken, metadata);
      } else {
        throw new Error('Public token not found in success response');
      }

      // Call optional callback
      if (success.publicToken) {
        onSuccess?.(success.publicToken, metadata);
      }

      // Show success message
      Alert.alert(
        'Success!',
        `Successfully connected ${metadata.accounts?.length || 1} account(s). Your financial data will now sync automatically.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      // Always log errors
      console.error('[Plaid] ❌ Failed to process success:', error);
      
      const errorDetails = error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : { error: String(error) };

      console.error('[Plaid]   Error Details:', JSON.stringify(errorDetails, null, 2));

      // Store error diagnostics
      await storeDiagnostics({
        lastError: {
          timestamp: new Date().toISOString(),
          type: 'success_processing',
          ...errorDetails,
        },
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(
        'Error',
        'Failed to complete bank connection. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [handlePlaidSuccess, onSuccess]);

  // Handle Plaid Link exit
  const handleExit = useCallback((exit: LinkExit) => {
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    console.log('[Plaid] 🚪 Link Exit');
    if (exit.error) {
      console.log('[Plaid]   Exit Error:', JSON.stringify(exit.error, null, 2));
    } else {
      console.log('[Plaid]   User cancelled connection');
    }

    // Store exit diagnostics
    storeDiagnostics({
      lastExit: {
        timestamp: new Date().toISOString(),
        error: exit.error ? {
          error_message: exit.error.errorMessage,
          error_code: exit.error.errorCode,
          display_message: exit.error.displayMessage,
        } : null,
      },
    });

    // Call context handler
    handlePlaidExit(exit.error ? {
      error_message: exit.error.errorMessage || exit.error.displayMessage,
      display_message: exit.error.displayMessage,
      error_code: exit.error.errorCode,
    } : null);

    // Call optional callback
    onExit?.(exit);

    // Show appropriate message
    if (exit.error) {
      Alert.alert(
        'Connection Cancelled',
        exit.error.displayMessage || exit.error.errorMessage || 'Bank connection was cancelled.',
        [{ text: 'OK' }]
      );
    }
  }, [handlePlaidExit, onExit]);

  // Initialize and open Plaid Link when linkToken is available and connecting
  useEffect(() => {
    if (state.linkToken && state.isConnecting) {
      console.log('[Plaid] 🔄 Link token and connecting state detected');
      console.log('[Plaid]   SDK Available:', SDKAvailable);
      console.log('[Plaid]   Link Token:', state.linkToken.substring(0, 20) + '...');
      
      // Set a timeout to prevent infinite loading
      // Increased to 2 minutes to allow users time to complete bank connection flow
      timeoutRef.current = setTimeout(() => {
        console.warn('[Plaid] ⚠️ Connection timeout (2 minutes elapsed)');
        handleExit({ 
          metadata: {} as any,
          error: { 
            errorMessage: 'Connection timeout - please try again',
            errorCode: 'TIMEOUT' as any,
            errorType: 'INITIALIZATION_ERROR' as any
          } as any
        });
      }, 120000) as any; // 2 minute timeout (120 seconds)

      // Initialize and open Plaid Link
      openPlaidLink();
    }

    // Cleanup timeout on unmount or when connecting state changes
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [state.linkToken, state.isConnecting]);

  const openPlaidLink = useCallback(async () => {
    try {
      console.log('[Plaid] 🚀 Opening Plaid Link...');
      console.log('[Plaid]   State:', {
        hasLinkToken: !!state.linkToken,
        isConnecting: state.isConnecting,
        sdkAvailable: SDKAvailable,
      });

      // Check if SDK is available
      if (!SDKAvailable) {
        const isExpoGoEnv = isRunningInExpoGoEarly();
        if (isExpoGoEnv) {
          throw new Error(
            'Plaid SDK requires a development or production build. This feature is not available in Expo Go. ' +
            'Please use a development build or TestFlight version to connect your bank accounts.'
          );
        } else {
          throw new Error(
            'Bank connection feature is temporarily unavailable. ' +
            'Please ensure you have the latest version of the app installed, or contact support if the issue persists.'
          );
        }
      }

      // Check link token availability
      if (!state.linkToken) {
        console.error('[Plaid] ❌ Link token not available');
        throw new Error('Unable to connect to bank services. Please check your internet connection and try again.');
      }

      // Log diagnostics
      logDiagnostics({
        action: 'open_link',
        hasLinkToken: !!state.linkToken,
        isConnecting: state.isConnecting,
        sdkAvailable: SDKAvailable,
      });

      console.log('[Plaid]   Platform:', Platform.OS);
      console.log('[Plaid]   Link Token:', state.linkToken.substring(0, 20) + '...');

      // Step 1: (Re)create Plaid Link session with latest token
      // Plaid requires create() to be called before each open() session.
      // If a previous session exists, destroy it first.
      if (linkCreatedRef.current) {
        console.log('[Plaid] 🔄 Destroying previous Plaid Link session before creating a new one...');
        try {
          await destroy();
        } catch (e) {
          console.warn('[Plaid] Warning destroying previous session (safe to continue):', e);
        }
        linkCreatedRef.current = false;
        setIsInitialized(false);
      }

      console.log('[Plaid] 📦 Creating Plaid Link session...');
      create({
        token: state.linkToken,
        noLoadingState: false,
        logLevel: LinkLogLevel.ERROR,
      });
      linkCreatedRef.current = true;
      setIsInitialized(true);
      console.log('[Plaid] ✅ Plaid Link session created');

      // Step 2: Open Plaid Link
      console.log('[Plaid] 🚪 Opening Plaid Link modal...');
      open({
        onSuccess: handleSuccess,
        onExit: handleExit,
        iOSPresentationStyle: LinkIOSPresentationStyle.MODAL,
      });
      
      console.log('[Plaid] ✅ Plaid Link open() called successfully');

      // Store success diagnostics
      await storeDiagnostics({
        lastOpenSuccess: {
          timestamp: new Date().toISOString(),
          platform: Platform.OS,
        },
      });

    } catch (error) {
      // Always log errors
      console.error('[Plaid] ❌ Failed to open Plaid Link:', error);

      const errorDetails = error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : { error: String(error) };

      console.error('[Plaid]   Error Details:', JSON.stringify(errorDetails, null, 2));

      // Store error diagnostics
      await storeDiagnostics({
        lastOpenError: {
          timestamp: new Date().toISOString(),
          ...errorDetails,
          sdkAvailable: SDKAvailable,
          hasLinkToken: !!state.linkToken,
          isExpoGo: isRunningInExpoGoEarly(),
        },
      });

      // Enhanced error handling with user-friendly messages
      let errorMessage = 'Failed to open bank connection. Please try again.';
      let showRetry = true;

      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Don't show retry for Expo Go errors
        if (error.message.includes('Expo Go')) {
          showRetry = false;
        }
        
        // Don't show retry for SDK not available errors
        if (error.message.includes('not available') || error.message.includes('temporarily unavailable')) {
          showRetry = false;
        }
      }

      // Always show error to user - don't silently fail
      console.error('[Plaid] ⚠️ Showing error alert to user');
      
      Alert.alert(
        'Connection Error',
        errorMessage,
        showRetry
          ? [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                  console.log('[Plaid] User cancelled after error');
                  handleExit({ 
                    metadata: {} as any,
                    error: { 
                      errorMessage: errorMessage,
                      errorCode: (error as any)?.errorCode || 'UNKNOWN',
                      errorType: (error as any)?.errorType || 'UNKNOWN'
                    } as any 
                  });
                },
              },
              {
                text: 'Try Again',
                onPress: async () => {
                  console.log('[Plaid] User chose to retry');
                  // Clean up previous session
                  try {
                    await destroy();
                    linkCreatedRef.current = false;
                    setIsInitialized(false);
                  } catch (e) {
                    console.warn('[Plaid] Error destroying previous session:', e);
                  }
                  // Retry opening link
                  openPlaidLink();
                },
              },
            ]
          : [
              {
                text: 'OK',
                onPress: () => {
                  console.log('[Plaid] User dismissed error');
                  handleExit({ 
                    metadata: {} as any,
                    error: { 
                      errorMessage: errorMessage,
                      errorCode: (error as any)?.errorCode || 'UNKNOWN',
                      errorType: (error as any)?.errorType || 'UNKNOWN'
                    } as any 
                  });
                },
              },
            ]
      );
    }
  }, [state.linkToken, state.isConnecting, handleSuccess, handleExit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Cleanup Plaid Link session
      if (linkCreatedRef.current) {
        try {
          destroy().catch((error) => {
            // Errors during cleanup are not critical, but log them
            if (__DEV__) {
            console.warn('[Plaid] Error destroying Plaid Link session:', error);
            }
          });
          dismissLink();
        } catch (error) {
          // Errors during cleanup are not critical, but log them
          if (__DEV__) {
          console.warn('[Plaid] Error cleaning up Plaid Link:', error);
          }
        }
        linkCreatedRef.current = false;
      }
    };
  }, []);

  // This component doesn't render anything - it's just for handling Plaid Link
  return null;
}

// Public component that conditionally renders based on SDK availability
export function PlaidLinkComponent(props: PlaidLinkComponentProps) {
  // Only render the inner component if SDK is available
  // This prevents NativeEventEmitter from being created with null native module
  if (!SDKAvailable) {
    return null;
  }

  return <PlaidLinkComponentInner {...props} />;
}

// Hook to trigger Plaid Link
export function usePlaidLink() {
  const { connectBank, state } = usePlaid();

  const openLink = async () => {
    try {
      console.log('[Plaid] 🔗 Initiating Plaid Link connection...');
      console.log('[Plaid]   Current State:', {
        isConnecting: state.isConnecting,
        hasLinkToken: !!state.linkToken,
        connectionError: state.connectionError,
      });

      // Check if already connecting
      if (state.isConnecting) {
        console.log('[Plaid] ⚠️ Already connecting, ignoring duplicate request');
        return;
      }

      await connectBank();

      console.log('[Plaid] ✅ Link token created successfully');
      console.log('[Plaid]   Link Token:', state.linkToken?.substring(0, 20) + '...');
      
      // Note: The PlaidLinkComponent will automatically open when linkToken and isConnecting are set
    } catch (error) {
      // Always log errors
      console.error('[Plaid] ❌ Failed to prepare Plaid Link:', error);
      
      if (error instanceof Error) {
        const errorDetails = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
        console.error('[Plaid]   Error Details:', JSON.stringify(errorDetails, null, 2));
      }
      
      // Show error to user - don't silently fail
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to start bank connection. Please try again.';
      
      Alert.alert(
        'Connection Error',
        errorMessage,
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('[Plaid] User dismissed connection error');
            },
          },
        ]
      );
      
      // Re-throw so calling code can handle if needed
      throw error;
    }
  };

  return {
    openLink,
    isConnecting: state.isConnecting,
    hasLinkToken: !!state.linkToken,
  };
}

// Export the component as default
export default PlaidLinkComponent;
