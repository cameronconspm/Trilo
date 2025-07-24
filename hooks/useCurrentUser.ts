import { useAuth } from '@/context/AuthContext';
import { User } from '@supabase/supabase-js';

interface CurrentUserHook {
  user: User | null;
  userId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requireUserId: () => string;
  userEmail: string | null;
  userDisplayName: string;
}

/**
 * Hook to easily access current user information throughout the app.
 */
export function useCurrentUser(): CurrentUserHook {
  const { user, userId, isAuthenticated, isLoading } = useAuth();

  const requireUserId = (): string => {
    if (!userId) {
      throw new Error('User must be authenticated to perform this action.');
    }
    return userId;
  };

  const userEmail = user?.email ?? null;
  const userDisplayName =
    user?.user_metadata?.full_name || userEmail?.split('@')[0] || 'User';

  return {
    user,
    userId,
    isAuthenticated,
    isLoading,
    requireUserId,
    userEmail,
    userDisplayName,
  };
}
