import { getNetworkStatusMessage } from '@/hooks/useNetworkStatus';
import type { NetworkStatus } from '@/hooks/useNetworkStatus';

// Note: Full hook testing would require React Testing Library
// For now, we test the utility functions
describe('useNetworkStatus utilities', () => {
  describe('getNetworkStatusMessage', () => {
    it('should return offline message when offline', () => {
      const status: NetworkStatus = {
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
        isOffline: true,
      };

      const message = getNetworkStatusMessage(status);
      expect(message).toContain('No internet connection');
    });

    it('should return connection issue message when not connected', () => {
      const status: NetworkStatus = {
        isConnected: false,
        isInternetReachable: null,
        type: 'unknown',
        isOffline: false,
      };

      const message = getNetworkStatusMessage(status);
      expect(message).toContain('Connection issue');
    });

    it('should return connected message when online', () => {
      const status: NetworkStatus = {
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
        isOffline: false,
      };

      const message = getNetworkStatusMessage(status);
      expect(message).toBe('Connected');
    });

    it('should handle unreachable internet state', () => {
      const status: NetworkStatus = {
        isConnected: true,
        isInternetReachable: false,
        type: 'wifi',
        isOffline: false,
      };

      const message = getNetworkStatusMessage(status);
      expect(message).toContain('Connected but internet is not reachable');
    });
  });
});
