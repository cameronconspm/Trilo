/**
 * Network Status Hook
 * 
 * Detects network connectivity and provides offline/online state
 * 
 * Uses @react-native-community/netinfo for accurate network detection
 */

import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

// Try to import NetInfo, but handle gracefully if native module is not available (Expo Go)
let NetInfo: any = null;
let NetInfoState: any = null;

try {
  const netInfoModule = require('@react-native-community/netinfo');
  NetInfo = netInfoModule.default || netInfoModule;
  NetInfoState = netInfoModule.NetInfoState;
} catch (error) {
  // NetInfo not available (e.g., in Expo Go without dev client)
  // Will fall back to optimistic online status
  if (__DEV__) {
    console.log('[useNetworkStatus] NetInfo native module not available, using optimistic online status (Expo Go compatibility)');
  }
}

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  isOffline: boolean;
}

/**
 * Hook to monitor network connectivity status
 * 
 * - In production builds: Uses NetInfo for accurate network detection
 * - In Expo Go: Falls back to optimistic online status (NetInfo requires native modules)
 * 
 * @returns NetworkStatus object with connectivity information
 * 
 * @example
 * ```tsx
 * const { isConnected, isOffline } = useNetworkStatus();
 * 
 * if (isOffline) {
 *   return <OfflineIndicator />;
 * }
 * ```
 */
export function useNetworkStatus(): NetworkStatus {
  const [networkState, setNetworkState] = useState<NetworkStatus>({
    isConnected: true, // Optimistic default for Expo Go compatibility
    isInternetReachable: true,
    type: Platform.OS === 'ios' ? 'wifi' : 'cellular',
    isOffline: false,
  });

  useEffect(() => {
    // Only use NetInfo if available (requires native module, not available in Expo Go)
    if (!NetInfo) {
      // In Expo Go, return optimistic online status
      // Network detection will work in production builds with dev client
      return;
    }

    // Check initial network state
    NetInfo.fetch()
      .then((state: any) => {
        const isOffline = !(state.isConnected && state.isInternetReachable !== false);
        
        setNetworkState({
          isConnected: state.isConnected ?? false,
          isInternetReachable: state.isInternetReachable ?? null,
          type: state.type,
          isOffline,
        });
      })
      .catch((error: any) => {
        // If NetInfo fails, keep optimistic online status
        if (__DEV__) {
          console.warn('[useNetworkStatus] Failed to fetch network state:', error);
        }
      });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: any) => {
      const isOffline = !(state.isConnected && state.isInternetReachable !== false);
      
      setNetworkState({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? null,
        type: state.type,
        isOffline,
      });
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return networkState;
}

/**
 * Get a user-friendly network status message
 */
export function getNetworkStatusMessage(status: NetworkStatus): string {
  if (status.isOffline) {
    return 'No internet connection. Some features may be unavailable.';
  }
  
  if (!status.isConnected) {
    return 'Connection issue detected. Please check your network.';
  }
  
  if (status.isInternetReachable === false) {
    return 'Connected but internet is not reachable.';
  }
  
  return 'Connected';
}

