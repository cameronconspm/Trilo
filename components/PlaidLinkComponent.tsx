import React, { useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { usePlaid, PlaidLinkMetadata } from '@/context/PlaidContext';

// Import Plaid SDK with proper error handling
let PlaidLink: any = null;
let PlaidLinkError: any = null;

try {
  const PlaidSDK = require('react-native-plaid-link-sdk');
  PlaidLink = PlaidSDK.PlaidLink;
  PlaidLinkError = PlaidSDK.PlaidLinkError;
} catch (error) {
  console.warn('Plaid SDK not available in current environment:', (error as Error).message);
}

interface PlaidLinkComponentProps {
  onSuccess?: (publicToken: string, metadata: PlaidLinkMetadata) => void;
  onExit?: (error: any) => void;
  onEvent?: (event: any) => void;
}

export function PlaidLinkComponent({ 
  onSuccess, 
  onExit, 
  onEvent 
}: PlaidLinkComponentProps) {
  const { state, handlePlaidSuccess, handlePlaidExit, dispatch } = usePlaid();
  const linkRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle Plaid Link success
  const handleSuccess = async (publicToken: string, metadata: PlaidLinkMetadata) => {
    try {
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      console.log('🎉 Plaid Link Success:', { publicToken, metadata });
      
      // Call context handler
      await handlePlaidSuccess(publicToken, metadata);
      
      // Call optional callback
      onSuccess?.(publicToken, metadata);
      
      // Show success message
      Alert.alert(
        'Success!',
        `Successfully connected ${metadata.accounts?.length || 1} account(s). Your financial data will now sync automatically.`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('❌ Failed to process Plaid success:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(
        'Error',
        'Failed to complete bank connection. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Handle Plaid Link exit
  const handleExit = (error: any) => {
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    console.log('🚪 Plaid Link Exit:', error);
    
    // Call context handler
    handlePlaidExit(error);
    
    // Call optional callback
    onExit?.(error);
    
    // Show appropriate message
    if (error) {
      Alert.alert(
        'Connection Cancelled',
        error.error_message || 'Bank connection was cancelled.',
        [{ text: 'OK' }]
      );
    }
  };

  // Handle Plaid Link events
  const handleEvent = (event: any) => {
    console.log('📊 Plaid Link Event:', event);
    onEvent?.(event);
  };

  // Open Plaid Link when linkToken is available and connecting
  useEffect(() => {
    if (state.linkToken && state.isConnecting) {
      // Set a timeout to prevent infinite loading
      timeoutRef.current = setTimeout(() => {
        console.warn('⚠️ Plaid connection timeout');
        handleExit({ error_message: 'Connection timeout' });
      }, 10000) as any; // 10 second timeout
      
      // Always attempt to open Plaid Link
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

  // Removed fallback options - Plaid Link should open directly

  const openPlaidLink = async () => {
    try {
      if (!PlaidLink) {
        throw new Error('Plaid SDK not available - requires development build');
      }

      if (!state.linkToken) {
        throw new Error('No link token available');
      }

      console.log('🚀 Opening Plaid Link...');

      // Configure Plaid Link
      const config = {
        token: state.linkToken,
        onSuccess: handleSuccess,
        onExit: handleExit,
        onEvent: handleEvent,
      };

      // Create and open Plaid Link
      linkRef.current = new PlaidLink(config);
      await linkRef.current.open();

    } catch (error) {
      console.error('❌ Failed to open Plaid Link:', error);
      
      // Enhanced error handling
      if (error instanceof Error) {
        Alert.alert(
          'Connection Error', 
          `Failed to open bank connection: ${error.message}`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => handleExit({ error_message: error.message }) },
            { text: 'Try Again', onPress: () => openPlaidLink() }
          ]
        );
      } else {
        Alert.alert(
          'Connection Error', 
          'Failed to open bank connection. Please try again.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => handleExit({ error_message: 'Unknown error' }) },
            { text: 'Try Again', onPress: () => openPlaidLink() }
          ]
        );
      }
    }
  };

  // Mock functionality removed - using real Plaid sandbox only

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Cleanup Plaid Link
      if (linkRef.current) {
        try {
          linkRef.current.destroy?.();
        } catch (error) {
          console.warn('Error destroying Plaid Link:', error);
        }
      }
    };
  }, []);

  // This component doesn't render anything - it's just for handling Plaid Link
  return null;
}

// Hook to trigger Plaid Link
export function usePlaidLink() {
  const { connectBank, state } = usePlaid();

  const openLink = async () => {
    try {
      await connectBank();
    } catch (error) {
      console.error('Failed to prepare Plaid Link:', error);
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

