import { useAuth } from '@/context/AuthContext';

/**
 * Hook to easily access current user information throughout the app
 * Returns the current user ID and other user-related data
 */
export function useCurrentUser() {
  const { user, userId, isAuthenticated, isLoading } = useAuth();

  return {
    user,
    userId,
    isAuthenticated,
    isLoading,
    // Helper to get user ID or throw error if not authenticated
    requireUserId: (): string => {
      if (!userId) {
        throw new Error('User must be authenticated to perform this action');
      }
      return userId;
    },
    // Helper to get user email
    userEmail: user?.email || null,
    // Helper to get user display name
    userDisplayName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
  };
}