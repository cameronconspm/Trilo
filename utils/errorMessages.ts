/**
 * Error Message Utilities
 * 
 * Provides user-friendly, actionable error messages
 * for common error scenarios
 */

export interface ErrorContext {
  operation?: string;
  entity?: string;
  details?: string;
  action?: string;
}

/**
 * Get a user-friendly error message based on error type
 */
export function getUserFriendlyErrorMessage(
  error: unknown,
  context?: ErrorContext
): string {
  const operation = context?.operation || 'operation';
  const entity = context?.entity || 'item';
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (message.includes('network') || message.includes('fetch')) {
      return `Unable to connect. Please check your internet connection and try again.`;
    }
    
    if (message.includes('timeout')) {
      return `Request timed out. Please check your connection and try again.`;
    }
    
    // Storage errors
    if (message.includes('storage') || message.includes('asyncstorage')) {
      return `Unable to save ${entity}. Please try again or restart the app.`;
    }
    
    // Authentication errors
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('permission')) {
      return `Authentication required. Please sign in and try again.`;
    }
    
    // Validation errors
    if (message.includes('invalid') || message.includes('validation')) {
      const detail = context?.details || error.message;
      return `Invalid input: ${detail}. Please check and try again.`;
    }
    
    // Not found errors
    if (message.includes('not found') || message.includes('404')) {
      return `${entity} not found. It may have been deleted.`;
    }
    
    // Server errors
    if (message.includes('500') || message.includes('server error')) {
      return `Server error occurred. Please try again in a moment.`;
    }
    
    // Generic error with context
    if (context?.action) {
      return `${context.action}: ${error.message}`;
    }
    
    // Fallback to original message if it's user-friendly
    if (error.message.length < 100 && !error.message.includes('error:')) {
      return error.message;
    }
  }
  
  // Unknown error type
  return `Unable to ${operation}. Please try again.${context?.details ? ` ${context.details}` : ''}`;
}

/**
 * Get actionable error message with suggested next steps
 */
export function getActionableErrorMessage(
  error: unknown,
  context?: ErrorContext
): { message: string; action?: string } {
  const baseMessage = getUserFriendlyErrorMessage(error, context);
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network errors - suggest checking connection
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return {
        message: baseMessage,
        action: 'Check your internet connection and try again',
      };
    }
    
    // Storage errors - suggest restarting
    if (message.includes('storage') || message.includes('asyncstorage')) {
      return {
        message: baseMessage,
        action: 'Try closing and reopening the app',
      };
    }
    
    // Authentication errors - suggest signing in
    if (message.includes('auth') || message.includes('unauthorized')) {
      return {
        message: baseMessage,
        action: 'Sign out and sign back in',
      };
    }
    
    // Validation errors - suggest checking input
    if (message.includes('invalid') || message.includes('validation')) {
      return {
        message: baseMessage,
        action: 'Check your input and try again',
      };
    }
  }
  
  return { message: baseMessage };
}

/**
 * Check if error is likely a network/offline error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('offline') ||
      message.includes('enotfound')
    );
  }
  return false;
}

/**
 * Check if error is likely a storage error
 */
export function isStorageError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('storage') ||
      message.includes('asyncstorage') ||
      message.includes('quota')
    );
  }
  return false;
}

